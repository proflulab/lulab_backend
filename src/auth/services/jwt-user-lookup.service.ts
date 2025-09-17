import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedUser, JwtUserLookup } from '../../security';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class JwtUserLookupService implements JwtUserLookup {
  constructor(private readonly userRepo: UserRepository) {}

  async getAuthenticatedUserById(
    id: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.userRepo.getUserByIdWithProfile(id);
    if (!user) return null;

    if (!user.active) {
      throw new UnauthorizedException('账户已被禁用');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('账户已被删除');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email || '',
      phone: user.phone,
      countryCode: user.countryCode,
      profile: user.profile as unknown as Record<string, unknown> | null,
    };
  }
}
