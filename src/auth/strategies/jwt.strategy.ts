/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-23 06:15:34
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-01 19:26:58
 * @FilePath: /lulab_backend/src/auth/strategies/jwt.strategy.ts
 * @Description: JWT 策略，用于验证和解析 JWT 令牌
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import {
  Injectable,
  Inject,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import {
  JWT_USER_LOOKUP,
  type JwtUserLookup,
  JWT_TOKEN_BLACKLIST,
  type JwtTokenBlacklist,
  type JwtPayload,
  type AuthenticatedUser,
} from '../../auth/types/jwt.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(JWT_USER_LOOKUP)
    private readonly userLookup: JwtUserLookup,
    @Optional()
    @Inject(JWT_TOKEN_BLACKLIST)
    private readonly blacklist?: JwtTokenBlacklist,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Optional token blacklist check (if provided by the app layer)
    if (payload?.jti && this.blacklist) {
      const revoked = await this.blacklist.isTokenBlacklisted(payload.jti);
      if (revoked) {
        throw new UnauthorizedException('访问令牌已撤销');
      }
    }
    const authUser = await this.userLookup.getAuthenticatedUserById(
      payload.sub,
    );
    if (!authUser) {
      throw new UnauthorizedException('用户不存在');
    }
    return authUser;
  }
}

// Export the symbols for use in other modules
export { JWT_USER_LOOKUP, JWT_TOKEN_BLACKLIST };
