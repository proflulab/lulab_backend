import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserProfileResponseDto } from '../dto/user-profile-response.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { formatUserResponse } from './utils/user-mapper';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly userRepo: UserRepository) {}

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.userRepo.getUserByIdWithProfile(userId);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }
    return formatUserResponse(user);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    ip: string,
    userAgent?: string,
  ): Promise<UserProfileResponseDto> {
    this.logger.log(`用户 ${userId} 正在更新资料，IP: ${ip}, UA: ${userAgent}`);
    const { username, email, phone, countryCode, name, avatar, bio } =
      updateProfileDto;

    const existingUser = await this.userRepo.getUserByIdWithProfile(userId);
    if (!existingUser) {
      throw new BadRequestException('用户不存在');
    }

    if (username && username !== existingUser.username) {
      const usernameExists = await this.userRepo.findUserByUsername(username);
      if (usernameExists) {
        throw new ConflictException('用户名已被使用');
      }
    }

    if (email && email !== existingUser.email) {
      const emailExists = await this.userRepo.findUserByEmail(email);
      if (emailExists) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    if (
      phone &&
      (phone !== existingUser.phone ||
        updateProfileDto.countryCode !== existingUser.countryCode)
    ) {
      const phoneExists = await this.userRepo.findUserByPhoneCombination(
        updateProfileDto.countryCode || existingUser.countryCode || '',
        phone,
      );
      if (phoneExists) {
        throw new ConflictException('手机号已被使用');
      }
    }

    const updatedUser = await this.userRepo.updateUserWithProfileUpsert(
      userId,
      {
        ...(username ? { username } : {}),
        email,
        phone,
        countryCode,
        profile: {
          name: name || username || email?.split('@')[0] || phone,
          avatar,
          bio,
        },
      },
    );

    return formatUserResponse(updatedUser);
  }
}
