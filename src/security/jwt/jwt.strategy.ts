import {
  Injectable,
  Inject,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload, AuthenticatedUser } from '../types';
import {
  JWT_USER_LOOKUP,
  type JwtUserLookup,
  JWT_TOKEN_BLACKLIST,
  type JwtTokenBlacklist,
} from '../types';

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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
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
