// 类型测试文件 - 仅用于验证类型定义
import { AuthenticatedUser, JwtPayload, LoginType } from './auth.types';

// 测试类型定义
const testUser: AuthenticatedUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  phone: '+8613800138000',
  countryCode: '+86',
  profile: {
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
  },
};

const testJwtPayload: JwtPayload = {
  sub: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  iat: Date.now(),
  exp: Date.now() + 3600000,
};

const testLoginType: LoginType = LoginType.EMAIL_PASSWORD;

// 确保类型可以正常使用
console.log('Type definitions are valid:', {
  user: testUser,
  payload: testJwtPayload,
  loginType: testLoginType,
});
