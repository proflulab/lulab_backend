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
    where: { platform: Platform; platformUuid: string },
    create: Omit<
      PlatformUserCreateInput,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'platform'
    >,
    update: Partial<
      Omit<
        PlatformUserUpdateInput,
        'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
      >
    >,
  ): Promise<PlatformUser> {
    // 首先查找是否存在相同 platformUuid 的记录
    const existingUser = await this.prisma.platformUser.findFirst({
      where: {
        platform: where.platform,
        platformUuid: where.platformUuid,
      },
    });

    if (existingUser) {
      // 如果存在，则更新
      return this.prisma.platformUser.update({
        where: { id: existingUser.id },
        data: {
          ...update,
          lastSeenAt: new Date(),
        },
      });
    } else {
      // 如果不存在，则创建
      return this.prisma.platformUser.create({
        data: {
          ...create,
          platform: where.platform,
          platformUuid: where.platformUuid,
          lastSeenAt: new Date(),
        },
      });
    }
  }

  async findPlatformUserByPlatformAndId(
    platform: Platform,
    platformUserId: string,
  ): Promise<PlatformUser | null> {
    return this.prisma.platformUser.findFirst({
      where: {
        platform,
        platformUserId,
      },
    });
  }

  async findPlatformUserByPlatformAndUuid(
    platform: Platform,
    platformUuid: string,
  ): Promise<PlatformUser | null> {
    return this.prisma.platformUser.findFirst({
      where: {
        platform,
        platformUuid,
      },
    });
  }

  async findPlatformUserById(id: string): Promise<PlatformUser | null> {
    return this.prisma.platformUser.findUnique({
      where: { id },
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
