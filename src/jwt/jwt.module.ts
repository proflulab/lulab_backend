/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-01 15:58:04
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-01 15:58:27
 * @FilePath: /lulab_backend/src/jwt/jwt.module.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { Module, Global } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { jwtConfig } from '@/configs/jwt.config';
import { RedisModule } from '@/redis/redis.module';
import { PrismaModule } from '@/prisma/prisma.module';

/**
 * JWT 独立模块
 * 
 * 将所有 JWT 相关功能集中管理，提供：
 * - JWT 令牌生成和验证
 * - 令牌黑名单管理
 * - 用户查找服务
 * - JWT 认证守卫
 * 
 * 作为全局模块，其他模块可以直接使用导出的服务
 */
@Global()
@Module({
  imports: [
    RedisModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule.forFeature(jwtConfig),
    NestJwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: (configService: ConfigService) => {
        const jwtConfigValue = configService.get(jwtConfig.KEY);
        return {
          secret: jwtConfigValue?.accessSecret,
          signOptions: {
            expiresIn: jwtConfigValue?.accessExpiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    // JWT 策略和守卫将在子模块中提供
  ],
  exports: [
    // 导出 NestJS JWT 模块的功能
    NestJwtModule,
  ],
})
export class JwtModule {}