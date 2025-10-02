/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-28 06:15:49
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-02 04:51:49
 * @FilePath: /lulab_backend/src/auth/types/auth.types.ts
 * @Description: 认证相关类型定义
 * 
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved. 
 */


// 刷新令牌接口
export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  jti: string;
  deviceInfo?: string | null;
  deviceId?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  expiresAt: Date;
  revokedAt?: Date | null;
  replacedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 创建刷新令牌数据接口
export interface CreateRefreshTokenData {
  userId: string;
  token: string;
  jti: string;
  expiresAt: Date;
  deviceInfo?: string;
  deviceId?: string;
  userAgent?: string;
  ip?: string;
}

// 撤销刷新令牌选项接口
export interface RevokeRefreshTokenOptions {
  revokedAt?: Date;
  replacedBy?: string;
}
