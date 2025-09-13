import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { TestDataFactory } from '../../fixtures/test-data.factory';
import { TestUtils } from '../../helpers/test-utils';

describe('AuthService', () => {
  let service: any; // 替换为实际的AuthService类型
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // AuthService, // 取消注释并导入实际的AuthService
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    // service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('用户注册', () => {
    it('应该成功创建新用户', async () => {
      const userData = TestDataFactory.createAuthPayload();
      
      // 模拟成功注册
      // const result = await service.register(userData);
      
      // expect(result).toHaveProperty('user');
      // expect(result).toHaveProperty('token');
      // expect(jwtService.sign).toHaveBeenCalled();
    });

    it('应该拒绝重复的邮箱注册', async () => {
      const userData = TestDataFactory.createAuthPayload();
      
      // 模拟重复邮箱错误
      // jest.spyOn(service, 'register').mockRejectedValue(
      //   new ConflictException('Email already exists')
      // );
      
      // await expect(service.register(userData))
      //   .rejects.toThrow(ConflictException);
    });
  });

  describe('用户登录', () => {
    it('应该使用正确凭据成功登录', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      // 模拟成功登录
      // const result = await service.login(loginData);
      
      // expect(result).toHaveProperty('user');
      // expect(result).toHaveProperty('token');
    });

    it('应该拒绝错误的密码', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      
      // 模拟密码错误
      // jest.spyOn(service, 'login').mockRejectedValue(
      //   new UnauthorizedException('Invalid credentials')
      // );
      
      // await expect(service.login(loginData))
      //   .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Token验证', () => {
    it('应该验证有效的token', async () => {
      const token = 'valid-token';
      const payload = { sub: 'user123', email: 'test@example.com' };
      
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      
      // const result = await service.validateToken(token);
      // expect(result).toEqual(payload);
    });

    it('应该拒绝无效的token', async () => {
      const token = 'invalid-token';
      
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // const result = await service.validateToken(token);
      // expect(result).toBeNull();
    });
  });
});