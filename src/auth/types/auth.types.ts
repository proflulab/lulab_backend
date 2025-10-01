import type { Request } from 'express';
import { User, UserProfile } from '@prisma/client';
import type {
  AuthenticatedUser as JwtAuthenticatedUser,
  JwtPayload as JwtPayloadBase,
} from './jwt.types';

// 复用 JWT 类型定义，避免多处维护
export type AuthenticatedUser = JwtAuthenticatedUser;
export type JwtPayload = JwtPayloadBase;

// 登录用户信息接口（包含Prisma完整结构）
export interface AuthUser extends User {
  profile?: UserProfile | null;
}

// 认证请求接口（用于装饰器）
export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

// 权限检查接口
export interface PermissionCheck {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// 角色权限接口
export interface RolePermission {
  role: string;
  permissions: string[];
}

// 用户权限接口
export interface UserPermission {
  userId: string;
  permissions: string[];
  roles: string[];
}

// 认证响应类型
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// 会话信息接口
export interface SessionInfo {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
}

// 认证配置接口
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  passwordMinLength: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

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
