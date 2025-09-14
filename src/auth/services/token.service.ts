import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(userId: string): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = { sub: userId };

    const accessSecret =
      this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'your-refresh-secret-key';
    const accessExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'your-refresh-secret-key';
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.userRepo.getUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      const accessSecret =
        this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
      const accessExpiresIn =
        this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
      const accessToken = this.jwtService.sign(
        { sub: user.id },
        {
          secret: accessSecret,
          expiresIn: accessExpiresIn,
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }
}
