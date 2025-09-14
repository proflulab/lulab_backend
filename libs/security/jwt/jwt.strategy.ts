import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload, AuthenticatedUser } from '../types';
import { JWT_USER_LOOKUP, type JwtUserLookup } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(JWT_USER_LOOKUP)
    private readonly userLookup: JwtUserLookup,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const authUser = await this.userLookup.getAuthenticatedUserById(
      payload.sub,
    );
    if (!authUser) {
      throw new UnauthorizedException('用户不存在');
    }
    return authUser;
  }
}
