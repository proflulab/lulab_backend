import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { PlatformUser, Platform, Prisma } from '@prisma/client';

type PlatformUserCreateInput = Prisma.PlatformUserUncheckedCreateInput;
type PlatformUserUpdateInput = Prisma.PlatformUserUncheckedUpdateInput;

@Injectable()
export class PlatformUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPlatformUser(
    data: Omit<
      PlatformUserCreateInput,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
  ): Promise<PlatformUser> {
    return this.prisma.platformUser.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updatePlatformUser(
    id: string,
    data: Partial<
      Omit<
        PlatformUserUpdateInput,
        'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
      >
    >,
  ): Promise<PlatformUser> {
    return this.prisma.platformUser.update({
      where: { id },
      data,
    });
  }

  async upsertPlatformUser(
    where: { platform: Platform; platformUserId: string },
    create: Omit<
      PlatformUserCreateInput,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
    update: Partial<
      Omit<
        PlatformUserUpdateInput,
        'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
      >
    >,
  ): Promise<PlatformUser> {
    return this.prisma.platformUser.upsert({
      where: {
        platform_platformUserId: where,
      },
      create: {
        ...create,
        lastSeenAt: new Date(),
      },
      update: {
        ...update,
        lastSeenAt: new Date(),
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
