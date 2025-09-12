import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  username?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!user.active) {
      throw new UnauthorizedException('账户已被禁用');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('账户已被删除');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profile: user.profile,
    };
  }
}
