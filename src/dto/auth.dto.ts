import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum, MinLength, Matches, IsPhoneNumber } from 'class-validator';

// 注册/登录类型枚举
export enum AuthType {
  USERNAME_PASSWORD = 'username_password',
  EMAIL_PASSWORD = 'email_password',
  EMAIL_CODE = 'email_code',
  PHONE_PASSWORD = 'phone_password',
  PHONE_CODE = 'phone_code',
}

// 验证码类型枚举
export enum CodeType {
  REGISTER = 'register',
  LOGIN = 'login',
  RESET_PASSWORD = 'reset_password',
}

// 注册DTO
export class RegisterDto {
  @ApiProperty({ description: '注册类型', enum: AuthType })
  @IsEnum(AuthType)
  type: AuthType;

  @ApiProperty({ description: '用户名', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: '用户名至少3个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username?: string;

  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({ description: '国家代码', required: false, example: '+86' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '密码', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, {
    message: '密码必须包含至少一个字母和一个数字',
  })
  password?: string;

  @ApiProperty({ description: '验证码', required: false })
  @IsOptional()
  @IsString()
  @MinLength(4, { message: '验证码至少4位' })
  code?: string;
}

// 登录DTO
export class LoginDto {
  @ApiProperty({ description: '登录类型', enum: AuthType })
  @IsEnum(AuthType)
  type: AuthType;

  @ApiProperty({ description: '用户名', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({ description: '国家代码', required: false, example: '+86' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '密码', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: '验证码', required: false })
  @IsOptional()
  @IsString()
  code?: string;
}

// 发送验证码DTO
export class SendCodeDto {
  @ApiProperty({ description: '目标邮箱或手机号' })
  @IsString()
  target: string;

  @ApiProperty({ description: '验证码类型', enum: CodeType })
  @IsEnum(CodeType)
  type: CodeType;

  @ApiProperty({ description: '国家代码（手机号时需要）', required: false, example: '+86' })
  @IsOptional()
  @IsString()
  countryCode?: string;
}

// 验证验证码DTO
export class VerifyCodeDto {
  @ApiProperty({ description: '目标邮箱或手机号' })
  @IsString()
  target: string;

  @ApiProperty({ description: '验证码' })
  @IsString()
  @MinLength(4, { message: '验证码至少4位' })
  code: string;

  @ApiProperty({ description: '验证码类型', enum: CodeType })
  @IsEnum(CodeType)
  type: CodeType;
}

// 重置密码DTO
export class ResetPasswordDto {
  @ApiProperty({ description: '目标邮箱或手机号' })
  @IsString()
  target: string;

  @ApiProperty({ description: '验证码' })
  @IsString()
  @MinLength(4, { message: '验证码至少4位' })
  code: string;

  @ApiProperty({ description: '新密码' })
  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, {
    message: '密码必须包含至少一个字母和一个数字',
  })
  newPassword: string;
}

// 更新用户资料DTO
export class UpdateProfileDto {
  @ApiProperty({ description: '用户名', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: '用户名至少3个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username?: string;

  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({ description: '国家代码', required: false, example: '+86' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '头像URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '姓名', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '个人简介', required: false })
  @IsOptional()
  @IsString()
  bio?: string;
}

// 认证响应DTO
export class AuthResponseDto {
  @ApiProperty({ description: '访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌' })
  refreshToken: string;

  @ApiProperty({ description: '用户信息' })
  user: {
    id: string;
    username?: string;
    email: string;
    phone?: string;
    countryCode?: string;
    createdAt: Date;
  };
}

// 用户信息响应DTO
export class UserProfileResponseDto {
  @ApiProperty({ description: '用户ID' })
  id: string;

  @ApiProperty({ description: '用户名' })
  username?: string;

  @ApiProperty({ description: '邮箱' })
  email: string;

  @ApiProperty({ description: '国家代码' })
  countryCode?: string;

  @ApiProperty({ description: '手机号' })
  phone?: string;

  @ApiProperty({ description: '邮箱验证状态' })
  emailVerified: boolean;

  @ApiProperty({ description: '手机验证状态' })
  phoneVerified: boolean;

  @ApiProperty({ description: '最后登录时间' })
  lastLoginAt?: Date;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '用户档案' })
  profile?: {
    name?: string;
    avatar?: string;
    bio?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: string;
    city?: string;
    country?: string;
  };
}