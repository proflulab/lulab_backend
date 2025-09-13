import { User, UserProfile } from '@prisma/client';

// 认证用户信息接口
export interface AuthenticatedUser {
  id: string;
  username?: string | null;
  email: string;
  phone?: string | null;
  countryCode?: string | null;
  profile?: {
    name?: string | null;
    avatar?: string | null;
    bio?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
}

// JWT载荷接口
export interface JwtPayload {
  sub: string;
  username?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

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

// 登录类型枚举
export enum LoginType {
  USERNAME_PASSWORD = 'USERNAME_PASSWORD',
  EMAIL_PASSWORD = 'EMAIL_PASSWORD',
  EMAIL_CODE = 'EMAIL_CODE',
  PHONE_PASSWORD = 'PHONE_PASSWORD',
  PHONE_CODE = 'PHONE_CODE',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

// 验证类型枚举
export enum VerificationType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  LOGIN_VERIFICATION = 'LOGIN_VERIFICATION',
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