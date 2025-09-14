import { User, UserProfile } from '@prisma/client';
import { UserProfileResponseDto } from '../../dto/user-profile-response.dto';

export function formatUserResponse(
  user: User & { profile: UserProfile | null },
): UserProfileResponseDto {
  return {
    id: user.id,
    username: user.username || undefined,
    email: user.email || '',
    countryCode: user.countryCode || undefined,
    phone: user.phone || undefined,
    emailVerified: !!user.emailVerifiedAt,
    phoneVerified: !!user.phoneVerifiedAt,
    lastLoginAt: user.lastLoginAt || undefined,
    createdAt: user.createdAt,
    profile: user.profile
      ? {
          name: user.profile.name || undefined,
          avatar: user.profile.avatar || undefined,
          bio: user.profile.bio || undefined,
          firstName: user.profile.firstName || undefined,
          lastName: user.profile.lastName || undefined,
          dateOfBirth: user.profile.dateOfBirth || undefined,
          gender: user.profile.gender || undefined,
          city: user.profile.city || undefined,
          country: user.profile.country || undefined,
        }
      : undefined,
  };
}
