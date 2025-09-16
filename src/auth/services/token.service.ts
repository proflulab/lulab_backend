import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repositories/user.repository';
import { randomUUID } from 'node:crypto';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepository,
    private readonly configService: ConfigService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {
    this.accessSecret =
      this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'your-refresh-secret-key';
    this.accessExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    this.refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  generateTokens(userId: string): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
      jwtid: randomUUID(),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
      jwtid: randomUUID(),
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<{ sub: string; jti?: string }>(
        refreshToken,
        {
          secret: this.refreshSecret,
        },
      );

      if (payload.jti) {
        const revoked = await this.tokenBlacklist.isTokenBlacklisted(
          payload.jti,
        );
        if (revoked) {
          throw new UnauthorizedException('刷新令牌无效');
        }
      }

      const user = await this.userRepo.getUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      const accessToken = this.jwtService.sign(
        { sub: user.id },
        {
          secret: this.accessSecret,
          expiresIn: this.accessExpiresIn,
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }
}
