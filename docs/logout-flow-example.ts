/**
 * 完整的退出登录流程示例
 * 
 * 本示例展示了从用户点击"退出登录"到所有令牌被撤销并生效的完整端到端流程
 */

// Type declarations for documentation purposes
declare const localStorage: any;
declare const console: any;
declare const window: any;
declare const fetch: any;
declare const getDeviceId: () => string;
declare const websocket: any;
declare const jwt: any;
declare const JWT_SECRET: string;
declare const JWT_REFRESH_SECRET: string;
declare const redis: any;
declare const db: any;
declare const UnauthorizedException: any;
declare const logout: () => Promise<any>;

// ================================
// 1. 前端发起登出请求
// ================================

/**
 * 前端调用示例
 */
async function frontendLogout() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const deviceId = getDeviceId(); // 获取设备ID

    try {
        // 发送登出请求
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refreshToken: refreshToken,
                deviceId: deviceId,
                revokeAllDevices: false, // 或 true 以登出所有设备
            }),
        });

        const result = await response.json();

        if (result.success) {
            console.log('登出成功:', result.message);
            console.log('详情:', result.details);

            // 清理本地存储
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            // 断开WebSocket连接
            if (websocket) {
                websocket.close();
            }

            // 重定向到登录页
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('登出失败:', error);
        // 即使失败，也清理本地令牌
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
}

// ================================
// 2. 后端处理流程（伪代码展示）
// ================================

/**
 * AuthController.logout() 处理流程
 */
async function backendLogoutFlow(user, accessToken, logoutDto) {
    const logoutResult = {
        accessTokenRevoked: false,
        refreshTokenRevoked: false,
        allDevicesLoggedOut: false,
        revokedTokensCount: 0,
        message: '',
    };

    try {
        // Step 1: 解码并验证访问令牌
        const accessPayload = jwt.verify(accessToken, JWT_SECRET);
        const accessJti = accessPayload.jti;

        // Step 2: 将访问令牌JTI加入Redis黑名单
        const ttl = Math.max(1, accessPayload.exp - Math.floor(Date.now() / 1000));
        await redis.set(`blacklist:access:${accessJti}`, '1', 'EX', ttl);
        logoutResult.accessTokenRevoked = true;

        // Step 3: 处理刷新令牌（如果提供）
        if (logoutDto.refreshToken) {
            // 验证刷新令牌
            const refreshPayload = jwt.verify(logoutDto.refreshToken, JWT_REFRESH_SECRET);
            const refreshJti = refreshPayload.jti;

            // 在数据库中撤销刷新令牌
            await db.refreshToken.update({
                where: { jti: refreshJti },
                data: { revokedAt: new Date() }
            });

            // 同时加入Redis黑名单
            const refreshTtl = Math.max(1, refreshPayload.exp - Math.floor(Date.now() / 1000));
            await redis.set(`blacklist:refresh:${refreshJti}`, '1', 'EX', refreshTtl);
            logoutResult.refreshTokenRevoked = true;
        }

        // Step 4: 设备级别撤销
        if (logoutDto.revokeAllDevices) {
            const revokedCount = await db.refreshToken.updateMany({
                where: {
                    userId: user.id,
                    revokedAt: null,
                },
                data: { revokedAt: new Date() }
            });
            logoutResult.allDevicesLoggedOut = true;
            logoutResult.revokedTokensCount = revokedCount.count;
            logoutResult.message = `退出登录成功，已撤销所有设备的 ${revokedCount.count} 个令牌`;
        } else if (logoutDto.deviceId) {
            const revokedCount = await db.refreshToken.updateMany({
                where: {
                    userId: user.id,
                    deviceId: logoutDto.deviceId,
                    revokedAt: null,
                },
                data: { revokedAt: new Date() }
            });
            logoutResult.revokedTokensCount = revokedCount.count;
            logoutResult.message = `退出登录成功，已撤销当前设备的 ${revokedCount.count} 个令牌`;
        } else {
            logoutResult.message = '退出登录成功';
        }

        return logoutResult;
    } catch (error) {
        console.error('Logout processing failed:', error);
        throw error;
    }
}

// ================================
// 3. 验证中间件检查流程
// ================================

/**
 * JWT验证中间件处理流程
 */
async function jwtValidationFlow(token) {
    try {
        // Step 1: 验证JWT签名和过期时间
        const payload = jwt.verify(token, JWT_SECRET);
        const jti = payload.jti;

        // Step 2: 检查Redis黑名单
        const isBlacklisted = await redis.exists(`blacklist:access:${jti}`);
        if (isBlacklisted) {
            throw new Error('访问令牌已撤销');
        }

        // Step 3: 查找用户
        const user = await db.user.findUnique({
            where: { id: payload.sub }
        });

        if (!user) {
            throw new Error('用户不存在');
        }

        return user;
    } catch (error) {
        throw new UnauthorizedException('令牌验证失败');
    }
}

// ================================
// 4. 刷新令牌验证流程
// ================================

/**
 * 刷新令牌验证流程
 */
async function refreshTokenValidationFlow(refreshToken) {
    try {
        // Step 1: 验证JWT签名和过期时间
        const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const jti = payload.jti;

        // Step 2: 检查Redis黑名单
        const isBlacklisted = await redis.exists(`blacklist:refresh:${jti}`);
        if (isBlacklisted) {
            throw new Error('刷新令牌已在黑名单中');
        }

        // Step 3: 检查数据库中的令牌状态
        const dbToken = await db.refreshToken.findUnique({
            where: { jti: jti }
        });

        if (!dbToken || dbToken.revokedAt || dbToken.expiresAt < new Date()) {
            throw new Error('刷新令牌无效或已过期');
        }

        return { payload, dbToken };
    } catch (error) {
        throw new UnauthorizedException('刷新令牌验证失败');
    }
}

// ================================
// 5. 具体API调用示例
// ================================

/**
 * 简单登出（只撤销当前令牌）
 */
const simpleLogout = {
    method: 'POST',
    url: '/api/auth/logout',
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
};

/**
 * 全面登出（撤销访问令牌和刷新令牌）
 */
const comprehensiveLogout = {
    method: 'POST',
    url: '/api/auth/logout',
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh...',
        deviceId: 'mobile-app-ios'
    })
};

/**
 * 登出所有设备
 */
const logoutAllDevices = {
    method: 'POST',
    url: '/api/auth/logout',
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh...',
        revokeAllDevices: true
    })
};

// ================================
// 6. 响应示例
// ================================

/**
 * 简单登出响应
 */
const simpleLogoutResponse = {
    success: true,
    message: '退出登录成功',
    details: {
        accessTokenRevoked: true,
        refreshTokenRevoked: false
    }
};

/**
 * 全面登出响应
 */
const comprehensiveLogoutResponse = {
    success: true,
    message: '退出登录成功，已撤销当前设备的 2 个令牌',
    details: {
        accessTokenRevoked: true,
        refreshTokenRevoked: true,
        allDevicesLoggedOut: false,
        revokedTokensCount: 2
    }
};

/**
 * 所有设备登出响应
 */
const allDevicesLogoutResponse = {
    success: true,
    message: '退出登录成功，已撤销所有设备的 5 个令牌',
    details: {
        accessTokenRevoked: true,
        refreshTokenRevoked: true,
        allDevicesLoggedOut: true,
        revokedTokensCount: 5
    }
};

// ================================
// 7. 错误处理和边界情况
// ================================

/**
 * 幂等性保证：多次登出不报错
 */
async function idempotentLogout() {
    // 第一次登出
    const response1 = await logout();
    console.log(response1); // { success: true, message: '退出登录成功' }

    // 第二次登出（令牌已失效）
    const response2 = await logout();
    console.log(response2); // 仍然返回成功，但详情显示令牌已失效
}

/**
 * 异常情况处理
 */
async function handleLogoutErrors() {
    try {
        await logout();
    } catch (error) {
        if (error.status === 401) {
            // 令牌已过期或无效，但仍清理本地存储
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        } else {
            // 其他错误，显示错误信息
            console.error('登出失败:', error.message);
        }
    }
}

// ================================
// 8. 完整时序图
// ================================

/**
 * 登出流程时序图（文字描述）
 * 
 * 1. 用户点击"退出登录"按钮
 * 2. 前端发送 POST /api/auth/logout 请求，携带 Authorization header 和可选的 refreshToken
 * 3. NestJS JWT Guard 验证访问令牌
 * 4. AuthController.logout() 被调用
 * 5. TokenService.logout() 处理令牌撤销：
 *    a. 解码访问令牌获取 jti
 *    b. 将访问令牌 jti 写入 Redis 黑名单（TTL = 令牌剩余时间）
 *    c. 如果提供刷新令牌，验证并撤销：
 *       - 在数据库中标记 revokedAt = now()
 *       - 将刷新令牌 jti 也写入 Redis 黑名单
 *    d. 根据选项撤销设备或所有设备的令牌
 * 6. 返回成功响应，包含撤销详情
 * 7. 前端清理本地存储的令牌
 * 8. 重定向到登录页
 * 
 * 后续请求验证：
 * 9. 任何使用被撤销令牌的请求都会被 JWT Guard 拒绝
 * 10. JWT Guard 检查 Redis 黑名单，发现令牌已撤销
 * 11. 返回 401 Unauthorized
 */

export {
    frontendLogout,
    backendLogoutFlow,
    jwtValidationFlow,
    refreshTokenValidationFlow,
    simpleLogout,
    comprehensiveLogout,
    logoutAllDevices,
    simpleLogoutResponse,
    comprehensiveLogoutResponse,
    allDevicesLogoutResponse,
    idempotentLogout,
    handleLogoutErrors,
};