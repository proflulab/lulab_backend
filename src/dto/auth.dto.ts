import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  Matches,
} from 'class-validator';

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
  @ApiProperty({
    description: '注册类型，支持邮箱验证码和手机验证码注册',
    enum: AuthType,
    enumName: 'AuthType',
    example: 'email_code',
    examples: {
      email_code: { summary: '邮箱验证码注册', value: 'email_code' },
      phone_code: { summary: '手机验证码注册', value: 'phone_code' },
    },
  })
  @IsEnum(AuthType)
  type: AuthType;

  @ApiProperty({
    description: '用户名，3-20个字符，只能包含字母、数字和下划线',
    required: false,
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_]+$',
    example: 'testuser123',
    examples: {
      simple: { summary: '简单用户名', value: 'testuser' },
      with_numbers: { summary: '包含数字', value: 'user123' },
      with_underscore: { summary: '包含下划线', value: 'test_user' },
    },
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: '用户名至少3个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username?: string;

  @ApiProperty({
    description: '邮箱地址，用于邮箱验证码注册时必填',
    required: false,
    format: 'email',
    example: 'user@example.com',
    examples: {
      gmail: { summary: 'Gmail邮箱', value: 'user@gmail.com' },
      company: { summary: '企业邮箱', value: 'user@company.com' },
      qq: { summary: 'QQ邮箱', value: 'user@qq.com' },
    },
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({
    description: '国家代码，手机号注册时必填',
    required: false,
    example: '+86',
    examples: {
      china: { summary: '中国', value: '+86' },
      usa: { summary: '美国', value: '+1' },
      uk: { summary: '英国', value: '+44' },
      japan: { summary: '日本', value: '+81' },
      korea: { summary: '韩国', value: '+82' },
    },
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({
    description: '手机号码，用于手机验证码注册时必填',
    required: false,
    example: '13800138000',
    examples: {
      china_mobile: { summary: '中国移动', value: '13800138000' },
      china_unicom: { summary: '中国联通', value: '15500155000' },
      china_telecom: { summary: '中国电信', value: '18900189000' },
    },
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: '密码，6-50个字符，必须包含至少一个字母和一个数字',
    required: false,
    minLength: 6,
    maxLength: 50,
    pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{6,}$',
    example: 'password123',
    examples: {
      simple: { summary: '简单密码', value: 'password123' },
      complex: { summary: '复杂密码', value: 'MyP@ssw0rd!' },
      medium: { summary: '中等复杂度', value: 'user123456' },
    },
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, {
    message: '密码必须包含至少一个字母和一个数字',
  })
  password?: string;

  @ApiProperty({
    description: '验证码，4-6位数字',
    required: false,
    minLength: 4,
    maxLength: 6,
    pattern: '^\\d{4,6}$',
    example: '123456',
    examples: {
      four_digit: { summary: '4位验证码', value: '1234' },
      six_digit: { summary: '6位验证码', value: '123456' },
    },
  })
  @IsOptional()
  @IsString()
  @MinLength(4, { message: '验证码至少4位' })
  code?: string;
}

// 登录DTO
export class LoginDto {
  @ApiProperty({
    description:
      '登录类型，支持用户名密码、邮箱密码、手机密码、邮箱验证码、手机验证码登录',
    enum: AuthType,
    enumName: 'AuthType',
    example: 'email_password',
    examples: {
      username_password: {
        summary: '用户名密码登录',
        value: 'username_password',
      },
      email_password: { summary: '邮箱密码登录', value: 'email_password' },
      phone_password: { summary: '手机密码登录', value: 'phone_password' },
      email_code: { summary: '邮箱验证码登录', value: 'email_code' },
      phone_code: { summary: '手机验证码登录', value: 'phone_code' },
    },
  })
  @IsEnum(AuthType)
  type: AuthType;

  @ApiProperty({
    description: '用户名，用户名密码登录时必填',
    required: false,
    example: 'testuser123',
    examples: {
      simple: { summary: '简单用户名', value: 'testuser' },
      with_numbers: { summary: '包含数字', value: 'user123' },
    },
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: '邮箱地址，邮箱登录时必填',
    required: false,
    format: 'email',
    example: 'user@example.com',
    examples: {
      gmail: { summary: 'Gmail邮箱', value: 'user@gmail.com' },
      company: { summary: '企业邮箱', value: 'user@company.com' },
    },
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({
    description: '国家代码，手机号登录时必填',
    required: false,
    example: '+86',
    examples: {
      china: { summary: '中国', value: '+86' },
      usa: { summary: '美国', value: '+1' },
    },
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({
    description: '手机号码，手机号登录时必填',
    required: false,
    example: '13800138000',
    examples: {
      china_mobile: { summary: '中国移动', value: '13800138000' },
      china_unicom: { summary: '中国联通', value: '15500155000' },
    },
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: '密码，密码登录时必填',
    required: false,
    example: 'password123',
    examples: {
      simple: { summary: '简单密码', value: 'password123' },
      complex: { summary: '复杂密码', value: 'MyP@ssw0rd!' },
    },
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: '验证码，验证码登录时必填',
    required: false,
    example: '123456',
    examples: {
      four_digit: { summary: '4位验证码', value: '1234' },
      six_digit: { summary: '6位验证码', value: '123456' },
    },
  })
  @IsOptional()
  @IsString()
  code?: string;
}

// 发送验证码DTO
export class SendCodeDto {
  @ApiProperty({
    description: '目标邮箱或手机号，根据注册方式选择对应的联系方式',
    example: 'user@example.com',
    examples: {
      email: {
        summary: '邮箱地址',
        value: 'user@example.com',
        description: '发送验证码到邮箱',
      },
      phone: {
        summary: '手机号码',
        value: '13800138000',
        description: '发送验证码到手机（需要先设置国家代码）',
      },
      international_phone: {
        summary: '国际手机号',
        value: '+1234567890',
        description: '包含国家代码的完整手机号',
      },
    },
  })
  @IsString()
  target: string;

  @ApiProperty({
    description: '验证码类型，不同场景使用不同类型的验证码',
    enum: CodeType,
    enumName: 'CodeType',
    example: 'register',
    examples: {
      register: {
        summary: '注册验证码',
        value: 'register',
        description: '用于新用户注册时验证邮箱或手机号',
      },
      login: {
        summary: '登录验证码',
        value: 'login',
        description: '用于免密登录或二次验证',
      },
      reset_password: {
        summary: '重置密码验证码',
        value: 'reset_password',
        description: '用于忘记密码时重置密码',
      },
    },
  })
  @IsEnum(CodeType)
  type: CodeType;

  @ApiProperty({
    description:
      '国家代码（仅当target为手机号时需要提供），用于标识手机号所属的国家或地区',
    required: false,
    example: '+86',
    examples: {
      china: {
        summary: '中国',
        value: '+86',
        description: '中国大陆地区',
      },
      usa: {
        summary: '美国',
        value: '+1',
        description: '美国和加拿大',
      },
      uk: {
        summary: '英国',
        value: '+44',
        description: '英国',
      },
      japan: {
        summary: '日本',
        value: '+81',
        description: '日本',
      },
      korea: {
        summary: '韩国',
        value: '+82',
        description: '韩国',
      },
    },
  })
  @IsOptional()
  @IsString()
  countryCode?: string;
}

// 验证验证码DTO
export class VerifyCodeDto {
  @ApiProperty({
    description: '目标邮箱或手机号，需要与发送验证码时的目标一致',
    example: 'user@example.com',
    examples: {
      email: { summary: '邮箱地址', value: 'user@example.com' },
      phone: { summary: '手机号码', value: '13800138000' },
    },
  })
  @IsString()
  target: string;

  @ApiProperty({
    description: '验证码，4-6位数字',
    minLength: 4,
    maxLength: 6,
    pattern: '^\\d{4,6}$',
    example: '123456',
    examples: {
      four_digit: { summary: '4位验证码', value: '1234' },
      six_digit: { summary: '6位验证码', value: '123456' },
    },
  })
  @IsString()
  @MinLength(4, { message: '验证码至少4位' })
  code: string;

  @ApiProperty({
    description: '验证码类型，需要与发送验证码时的类型一致',
    enum: CodeType,
    enumName: 'CodeType',
    example: 'register',
    examples: {
      register: { summary: '注册验证码', value: 'register' },
      login: { summary: '登录验证码', value: 'login' },
      reset_password: { summary: '重置密码验证码', value: 'reset_password' },
    },
  })
  @IsEnum(CodeType)
  type: CodeType;
}

// 重置密码DTO
export class ResetPasswordDto {
  @ApiProperty({
    description: '目标邮箱或手机号，需要是已注册的用户',
    example: 'user@example.com',
    examples: {
      email: { summary: '邮箱地址', value: 'user@example.com' },
      phone: { summary: '手机号码', value: '13800138000' },
    },
  })
  @IsString()
  target: string;

  @ApiProperty({
    description: '重置密码验证码，通过发送验证码接口获取',
    minLength: 4,
    maxLength: 6,
    pattern: '^\\d{4,6}$',
    example: '123456',
    examples: {
      four_digit: { summary: '4位验证码', value: '1234' },
      six_digit: { summary: '6位验证码', value: '123456' },
    },
  })
  @IsString()
  @MinLength(4, { message: '验证码至少4位' })
  code: string;

  @ApiProperty({
    description: '新密码，6-50个字符，必须包含至少一个字母和一个数字',
    minLength: 6,
    maxLength: 50,
    pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{6,}$',
    example: 'newPassword123',
    examples: {
      simple: { summary: '简单密码', value: 'newPassword123' },
      complex: { summary: '复杂密码', value: 'MyNewP@ssw0rd!' },
      medium: { summary: '中等复杂度', value: 'newPass456' },
    },
  })
  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, {
    message: '密码必须包含至少一个字母和一个数字',
  })
  newPassword: string;
}

// 更新用户资料DTO
export class UpdateProfileDto {
  @ApiProperty({
    description:
      '用户名，3-20个字符，只能包含字母、数字和下划线，不能与其他用户重复',
    required: false,
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_]+$',
    example: 'newusername',
    examples: {
      simple: { summary: '简单用户名', value: 'newuser' },
      with_numbers: { summary: '包含数字', value: 'user2024' },
      with_underscore: { summary: '包含下划线', value: 'new_user' },
    },
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: '用户名至少3个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username?: string;

  @ApiProperty({
    description: '邮箱地址，不能与其他用户重复，更改后需要重新验证',
    required: false,
    format: 'email',
    example: 'newemail@example.com',
    examples: {
      gmail: { summary: 'Gmail邮箱', value: 'newuser@gmail.com' },
      company: { summary: '企业邮箱', value: 'newuser@company.com' },
      qq: { summary: 'QQ邮箱', value: 'newuser@qq.com' },
    },
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({
    description: '国家代码，更新手机号时需要提供',
    required: false,
    example: '+86',
    examples: {
      china: { summary: '中国', value: '+86' },
      usa: { summary: '美国', value: '+1' },
      uk: { summary: '英国', value: '+44' },
      japan: { summary: '日本', value: '+81' },
    },
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({
    description: '手机号码，不能与其他用户重复，更改后需要重新验证',
    required: false,
    example: '13800138001',
    examples: {
      china_mobile: { summary: '中国移动', value: '13800138001' },
      china_unicom: { summary: '中国联通', value: '15500155001' },
      china_telecom: { summary: '中国电信', value: '18900189001' },
    },
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: '头像URL，支持http/https链接',
    required: false,
    format: 'uri',
    example: 'https://example.com/avatar.jpg',
    examples: {
      jpg: { summary: 'JPG格式', value: 'https://example.com/avatar.jpg' },
      png: { summary: 'PNG格式', value: 'https://example.com/avatar.png' },
      webp: { summary: 'WebP格式', value: 'https://example.com/avatar.webp' },
    },
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: '真实姓名或昵称',
    required: false,
    maxLength: 50,
    example: '张三',
    examples: {
      chinese: { summary: '中文姓名', value: '张三' },
      english: { summary: '英文姓名', value: 'John Doe' },
      nickname: { summary: '昵称', value: '小明' },
    },
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '个人简介或自我介绍',
    required: false,
    maxLength: 500,
    example: '这是我的个人简介',
    examples: {
      simple: { summary: '简单介绍', value: '热爱编程的开发者' },
      detailed: {
        summary: '详细介绍',
        value: '我是一名全栈开发工程师，专注于Web开发和移动应用开发。',
      },
      creative: { summary: '创意介绍', value: '代码改变世界，创新驱动未来！' },
    },
  })
  @IsOptional()
  @IsString()
  bio?: string;
}

// 认证响应DTO
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT访问令牌，用于API认证，有效期较短（通常1小时）',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    examples: {
      jwt_token: {
        summary: 'JWT令牌示例',
        value:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      },
    },
  })
  accessToken: string;

  @ApiProperty({
    description: '刷新令牌，用于获取新的访问令牌，有效期较长（通常7天）',
    example: 'refresh_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    examples: {
      refresh_token: {
        summary: '刷新令牌示例',
        value:
          'refresh_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE1MTYyMzkwMjJ9.abc123def456ghi789',
      },
    },
  })
  refreshToken: string;

  @ApiProperty({
    description: '用户基本信息',
    example: {
      id: 'user_123456789',
      username: 'johndoe',
      email: 'john@example.com',
      phone: '13800138000',
      countryCode: '+86',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  })
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
  @ApiProperty({
    description: '用户唯一标识符，系统自动生成',
    example: 'user_123456789',
    examples: {
      uuid: {
        summary: 'UUID格式',
        value: 'user_123e4567-e89b-12d3-a456-426614174000',
      },
      short_id: { summary: '短ID格式', value: 'user_123456789' },
    },
  })
  id: string;

  @ApiProperty({
    description: '用户名，全局唯一，可能为空（如果用户未设置）',
    required: false,
    example: 'johndoe',
    examples: {
      simple: { summary: '简单用户名', value: 'johndoe' },
      with_numbers: { summary: '包含数字', value: 'user2024' },
      with_underscore: { summary: '包含下划线', value: 'john_doe' },
    },
    nullable: true,
  })
  username?: string;

  @ApiProperty({
    description: '邮箱地址，用户的主要联系方式',
    format: 'email',
    example: 'john@example.com',
    examples: {
      gmail: { summary: 'Gmail邮箱', value: 'john@gmail.com' },
      company: { summary: '企业邮箱', value: 'john@company.com' },
      qq: { summary: 'QQ邮箱', value: 'john@qq.com' },
    },
  })
  email: string;

  @ApiProperty({
    description: '国家代码，与手机号配套使用',
    required: false,
    example: '+86',
    examples: {
      china: { summary: '中国', value: '+86' },
      usa: { summary: '美国', value: '+1' },
      uk: { summary: '英国', value: '+44' },
      japan: { summary: '日本', value: '+81' },
    },
    nullable: true,
  })
  countryCode?: string;

  @ApiProperty({
    description: '手机号码，可能为空（如果用户未绑定手机）',
    required: false,
    example: '13800138000',
    examples: {
      china_mobile: { summary: '中国移动', value: '13800138000' },
      china_unicom: { summary: '中国联通', value: '15500155000' },
      china_telecom: { summary: '中国电信', value: '18900189000' },
    },
    nullable: true,
  })
  phone?: string;

  @ApiProperty({
    description: '邮箱验证状态，true表示已验证，false表示未验证',
    example: true,
    examples: {
      verified: { summary: '已验证', value: true },
      unverified: { summary: '未验证', value: false },
    },
  })
  emailVerified: boolean;

  @ApiProperty({
    description: '手机验证状态，true表示已验证，false表示未验证',
    example: false,
    examples: {
      verified: { summary: '已验证', value: true },
      unverified: { summary: '未验证', value: false },
    },
  })
  phoneVerified: boolean;

  @ApiProperty({
    description: '最后登录时间，ISO 8601格式',
    required: false,
    format: 'date-time',
    example: '2024-12-01T10:30:00.000Z',
    examples: {
      recent: { summary: '最近登录', value: '2024-12-01T10:30:00.000Z' },
      old: { summary: '较早登录', value: '2024-11-15T08:20:00.000Z' },
    },
    nullable: true,
  })
  lastLoginAt?: Date;

  @ApiProperty({
    description: '账户创建时间，ISO 8601格式',
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
    examples: {
      recent: { summary: '最近创建', value: '2024-12-01T10:30:00.000Z' },
      old: { summary: '较早创建', value: '2023-06-15T08:20:00.000Z' },
    },
  })
  createdAt: Date;

  @ApiProperty({
    description: '用户详细档案信息',
    required: false,
    nullable: true,
    example: {
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg',
      bio: '热爱编程的全栈开发工程师',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01T00:00:00.000Z',
      gender: 'male',
      city: '北京',
      country: '中国',
    },
  })
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
