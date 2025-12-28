# 系统架构设计文档

## 概述

本文档详细描述了项目的系统架构设计，包括整体架构、模块划分、数据流和关键技术选型。

## 整体架构

### 架构图

```text
┌─────────────────────────────────────────────────────────────┐
│                    客户端/第三方服务                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/Webhook请求
┌─────────────────────▼───────────────────────────────────────┐
│                        API网关                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     负载均衡器                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
│   应用实例1  │ │ 应用实例2 │ │ 应用实例N │
└───────┬──────┘ └────┬──────┘ └────┬──────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
│   PostgreSQL │ │ 飞书服务  │ │ 对象存储  │
│     数据库   │ │           │ │ (OSS/COS) │
└──────────────┘ └───────────┘ └───────────┘
```

## 技术栈

### 后端技术栈

- 框架: NestJS (Node.js)
- 语言: TypeScript
- 数据库: PostgreSQL
- ORM: Prisma
- API 文档: Swagger/OpenAPI
- 测试: Jest + Supertest
- 构建: Nest build（tsc/SWC）
- 依赖管理: pnpm

### 第三方服务集成

- **腾讯会议**: Webhook事件接收和API调用（录制、参会者、转写、智能功能）
- **飞书**: 多维表格数据同步，支持 Upsert 操作
- **阿里云**: 短信服务 (SMS)
- **邮件服务**: SMTP/邮件API，支持 Nodemailer

### 现代化特性

- **GraphQL 支持**: 集成 Apollo Server，提供 GraphQL API 能力
- **定时任务**: 使用 @nestjs/schedule 支持定时任务调度
- **路径别名**: 配置 `@/` 指向 `src/`，提升代码可读性
- **TypeScript 支持**: 全面使用 TypeScript，配合 tsx 运行时工具

## 模块划分

### 核心模块

#### 1. 认证模块 (Auth Module)

- 服务分层架构：
  - **RegisterService**：注册流程（验证码校验、用户创建、欢迎邮件、登录日志）
  - **LoginService**：登录流程（密码/验证码、限流、登录日志、最后登录时间）
  - **PasswordService**：重置密码（验证码校验、密码强度校验、通知邮件）
  - **ProfileService**：用户资料（获取/更新、唯一性校验）
  - **TokenService**：令牌签发、刷新和验证
  - **TokenBlacklistService**：令牌撤销（黑名单，基于 jti，内存实现，支持 Redis 扩展）
  - **AuthPolicyService**：登录策略（失败次数限制、登录日志、类型映射）
  - **JwtUserLookupService**：用户查找和缓存服务
- 仓储层：
  - **UserRepository**：用户与档案读写
  - **LoginLogRepository**：登录日志统计与写入
  - **RefreshTokenRepository**：刷新令牌管理

#### 2. 会议模块 (Meeting Module)

- 会议记录管理
- 会议数据存储
- 会议文件处理
- 会议参与者管理

#### 5. 腾讯会议集成模块 (Tencent Meeting Module)

- **Webhook事件处理器**：
  - MeetingStartedHandler：会议开始事件
  - MeetingEndedHandler：会议结束事件
  - RecordingCompletedHandler：录制完成事件
- **服务层**：
  - TencentEventHandlerService：Webhook 事件分发
  - TencentMeetingConfigService：配置管理
- **控制器**：
  - TencentWebhookController：Webhook 事件接收
  - TencentMeetingController：管理接口

#### 4. 集成服务模块 (Integration Services)

##### 飞书集成 (Lark Integration)
- **LarkClient**：飞书 SDK 封装和 API 调用
- **BitableService**：多维表格操作服务
- **Repositories**：
  - MeetingBitableRepository：会议记录管理
  - MeetingUserBitableRepository：会议用户管理
  - RecordingFileBitableRepository：录制文件管理
- **类型定义**：MeetingData, MeetingUserData, RecordingFileData
- **异常处理**：Lark 相关异常类
- **数据验证**：字段验证器

##### 腾讯会议集成 (Tencent Meeting Integration)
- **TencentApiService**：腾讯会议开放 API 调用
- **加密工具**：签名验证和 AES 解密
- **类型定义**：会议、录制、参会者等 API 响应类型
- **异常处理**：腾讯会议 API 相关异常

##### 其他集成服务
- **阿里云短信 (Aliyun SMS)**：短信发送服务
- **邮件服务 (Email Service)**：SMTP 邮件发送服务

#### 6. 飞书会议模块 (Lark Meeting Module)

- **LarkWebhookController**：飞书 Webhook 事件接收
- **LarkWebhookService**：飞书事件处理服务
- **兼容性支持**：保留旧的 `/webhooks/feishu` 路由别名

#### 7. 邮件模块 (Email Module)

- **EmailController**：邮件发送 API 接口
- **EmailService**：邮件发送业务逻辑
- **模板管理**：邮件模板系统

#### 8. 验证码模块 (Verification Module)

- **VerificationController**：验证码 API 接口
- **VerificationService**：验证码生成、发送和验证
- **多渠道支持**：邮件和短信验证码

#### 9. 用户模块 (User Module)

- **UserController**：用户管理 API 接口
- **UserService**：用户信息管理业务逻辑
- **功能**：用户档案管理、权限控制

#### 10. 安全模块 (Security Module)

- **JWT 守卫**：JwtAuthGuard，提供路由级别的身份验证
- **装饰器**：@Public 装饰器，用于标记公开接口
- **类型定义**：安全相关类型和接口

#### 11. 公共模块 (Common Module)

- **工具类**：随机数生成、验证器、HTTP 文件处理
- **邮件模板**：邮件模板系统
- **枚举类型**：公共枚举定义

## 数据流设计

### 腾讯会议事件处理流程

```text
1. 腾讯会议平台发送Webhook事件
         ↓
2. TencentWebhookController 接收并验证请求
         ↓
3. TencentEventHandlerService 事件分发
         ↓
4. EventHandlerFactory 选择具体事件处理器
         ↓
5. 具体事件处理器处理业务逻辑
         ↓
6. 数据持久化到PostgreSQL数据库
         ↓
7. (可选) 同步数据到飞书多维表格
```

### 会议录制文件处理流程

```text
1. 接收录制完成事件 (RecordingCompletedHandler)
         ↓
2. 调用腾讯会诮API获取录制文件详情
         ↓
3. 下载录制文件（HttpFileUtil）
         ↓
4. 存储文件到对象存储
         ↓
5. 提取文件元数据
         ↓
6. 创建或更新数据库记录
         ↓
7. 同步到飞书 Bitable (通过 RecordingFileBitableRepository)
```

### 飞书 Bitable 数据同步流程

```text
1. 业务事件触发数据更新
         ↓
2. BitableRepository 接收数据操作请求
         ↓
3. 数据验证和类型转换 (FieldValidator)
         ↓
4. LarkClient 调用飞书 Bitable API
         ↓
5. Upsert 操作（基于唯一键去重）
         ↓
6. 返回操作结果和记录 ID
```

## 数据库设计

### 核心实体关系

```text
User 1───────┐
              ├── UserOrganization
Organization──┘

User 1───────┐
              ├── UserDepartment
Department───┘

User 1───────┐
              ├── UserRole
Role 1───────┤
              ├── RolePermission
Permission───┘

User 1───────┐
              ├── UserPermission
Permission───┘

Meetings 1───┐
              ├── MeetingParticipation
PlatformUser─┘

Meetings 1───┐
              ├── MeetingFile
User─────────┘

Meetings 1───┐
              ├── MeetingTranscript
User─────────┘

Meetings 1───┐
              ├── MeetingSummary
MeetingFile──┘
```

## 部署架构

### 开发环境

- 单实例应用
- 本地PostgreSQL数据库
- 开发者个人飞书应用
- 本地对象存储模拟

### 生产环境

- 多实例负载均衡
- 主从数据库集群
- 企业级飞书应用
- 云对象存储服务
- 监控和日志系统

## 安全设计

### 认证与授权

- JWT Token认证
- RBAC权限控制
- API密钥管理
- 请求签名验证

### 数据安全

- 敏感信息加密存储
- HTTPS通信
- 数据库连接加密
- 文件传输加密

### 应用安全

- 输入验证和过滤
- SQL注入防护
- XSS防护
- CSRF防护

## 性能优化

### 数据库优化

- 索引优化
- 查询优化
- 连接池管理
- 读写分离

### API优化

- 缓存策略
- 分页处理
- 异步处理
- 批量操作

### 集成优化

- 连接池复用
- 请求合并
- 异步处理
- 错误重试机制

## 监控与日志

### 日志级别

- ERROR: 错误信息
- WARN: 警告信息
- INFO: 一般信息
- DEBUG: 调试信息

### 监控指标

- API响应时间
- 数据库查询性能
- 第三方服务调用成功率
- 系统资源使用情况

## 扩展性设计

### 水平扩展

- 无状态应用设计
- 数据库读写分离
- 缓存集群
- 负载均衡

### 功能扩展

- 插件化架构
- 事件驱动设计
- 微服务拆分
- API网关管理

## 版本管理

### API版本控制

- URL路径版本控制: `/api/v1/`
- 向后兼容性保证
- 版本迁移策略

### 数据库版本控制

- Prisma Migrate
- 数据库迁移脚本
- 回滚机制

## 故障处理

### 容错机制

- 服务降级
- 熔断机制
- 超时控制
- 重试机制

### 数据备份

- 定期数据库备份
- 文件备份策略
- 灾难恢复计划
