import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { PlatformUser, Platform, Prisma } from '@prisma/client';

@Injectable()
export class PlatformUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPlatformUser(data: {
    platform: Platform;
    platformUserId: string;
    userName?: string | null;
    email?: string | null;
    avatar?: string | null;
    countryCode?: string | null;
    phone?: string | null;
    phoneHash?: string | null;
    userId?: string | null;
    platformData?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    isActive?: boolean;
  }): Promise<PlatformUser> {
    return this.prisma.platformUser.create({
      data: {
        platform: data.platform,
        platformUserId: data.platformUserId,
        userName: data.userName ?? null,
        email: data.email ?? null,
        avatar: data.avatar ?? null,
        countryCode: data.countryCode ?? null,
        phone: data.phone ?? null,
        phoneHash: data.phoneHash ?? null,
        userId: data.userId ?? null,
        platformData: data.platformData ?? undefined,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findPlatformUserByPlatformAndId(
    platform: Platform,
    platformUserId: string,
  ): Promise<PlatformUser | null> {
    return this.prisma.platformUser.findUnique({
      where: {
        platform_platformUserId: {
          platform,
          platformUserId,
        },
      },
    });
  }

  async findPlatformUserById(id: string): Promise<PlatformUser | null> {
    return this.prisma.platformUser.findUnique({
      where: { id },
    });
  }

  async findPlatformUserByEmail(email: string): Promise<PlatformUser | null> {
    return this.prisma.platformUser.findFirst({
      where: { email },
    });
  }

  async findPlatformUserByPhoneHash(
    phoneHash: string,
  ): Promise<PlatformUser | null> {
    return this.prisma.platformUser.findFirst({
      where: { phoneHash },
    });
  }

  async findPlatformUserByUserId(userId: string): Promise<PlatformUser[]> {
    return this.prisma.platformUser.findMany({
      where: { userId },
    });
  }

  async findActivePlatformUsersByPlatform(
    platform: Platform,
  ): Promise<PlatformUser[]> {
    return this.prisma.platformUser.findMany({
      where: {
        platform,
        isActive: true,
      },
    });
  }

  async updatePlatformUser(
    id: string,
    data: {
      userName?: string | null;
      email?: string | null;
      avatar?: string | null;
      countryCode?: string | null;
      phone?: string | null;
      phoneHash?: string | null;
      userId?: string | null;
      platformData?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
      isActive?: boolean;
      lastSeenAt?: Date | null;
    },
  ): Promise<PlatformUser> {
    return this.prisma.platformUser.update({
      where: { id },
      data: {
        ...(data.userName !== undefined && { userName: data.userName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.countryCode !== undefined && {
          countryCode: data.countryCode,
        }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.phoneHash !== undefined && { phoneHash: data.phoneHash }),
        ...(data.userId !== undefined && { userId: data.userId }),
        ...(data.platformData !== undefined && {
          platformData: data.platformData,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.lastSeenAt !== undefined && { lastSeenAt: data.lastSeenAt }),
      },
    });
  }

  async updateLastSeenAt(id: string): Promise<PlatformUser> {
    return this.prisma.platformUser.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  async deactivatePlatformUser(id: string): Promise<PlatformUser> {
    return this.prisma.platformUser.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activatePlatformUser(id: string): Promise<PlatformUser> {
    return this.prisma.platformUser.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
