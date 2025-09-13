import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export class TestUtils {
  /**
   * 生成认证token
   */
  static generateAuthToken(
    userId: string,
    email: string,
    role: string = 'USER',
  ): string {
    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'test-secret',
    });

    return jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }

  /**
   * 创建认证header
   */
  static getAuthHeaders(userId: string, email: string, role?: string) {
    const token = this.generateAuthToken(userId, email, role);
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * 通用HTTP响应验证
   */
  static expectSuccessResponse(response: any) {
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);
  }

  /**
   * 通用错误响应验证
   */
  static expectErrorResponse(response: any, statusCode: number = 400) {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  }

  /**
   * 分页响应验证
   */
  static expectPaginatedResponse(response: any) {
    this.expectSuccessResponse(response);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('items');
    expect(response.body.data).toHaveProperty('meta');
    expect(response.body.data.meta).toHaveProperty('total');
    expect(response.body.data.meta).toHaveProperty('page');
    expect(response.body.data.meta).toHaveProperty('limit');
  }

  /**
   * 验证对象结构
   */
  static expectObjectStructure(obj: any, structure: Record<string, any>) {
    Object.keys(structure).forEach((key) => {
      expect(obj).toHaveProperty(key);
      if (structure[key] === 'string') {
        expect(typeof obj[key]).toBe('string');
      } else if (structure[key] === 'number') {
        expect(typeof obj[key]).toBe('number');
      } else if (structure[key] === 'boolean') {
        expect(typeof obj[key]).toBe('boolean');
      } else if (Array.isArray(structure[key])) {
        expect(Array.isArray(obj[key])).toBe(true);
      } else if (typeof structure[key] === 'object') {
        this.expectObjectStructure(obj[key], structure[key]);
      }
    });
  }

  /**
   * 模拟延迟
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 重试机制
   */
  static async retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await this.sleep(delay);
        return this.retry(fn, retries - 1, delay);
      }
      throw error;
    }
  }

  /**
   * 清理测试数据
   */
  static async cleanupTestData() {
    // 清理上传的测试文件
    const fs = require('fs');
    const path = require('path');
    
    const testUploadsDir = path.join(__dirname, '../../uploads/test');
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
  }
}

/**
 * 通用测试接口响应结构
 */
export interface TestApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分页响应结构
 */
export interface PaginatedResponse<T = any> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 测试用户类型
 */
export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
  token?: string;
}