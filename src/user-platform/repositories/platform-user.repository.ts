import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { PlatformUser, Platform, Prisma } from '@prisma/client';

type PlatformUserCreateInput = Prisma.PlatformUserUncheckedCreateInput;
type PlatformUserUpdateInput = Prisma.PlatformUserUncheckedUpdateInput;

@Injectable()
export class PlatformUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
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

  async update(
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

  async upsert(
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

  async batchUpsert(
    items: Array<{
      where: { platform: Platform; platformUuid: string };
      create: Omit<
        PlatformUserCreateInput,
        'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'platform'
      >;
      update: Partial<
        Omit<
          PlatformUserUpdateInput,
          'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
        >
      >;
    }>,
  ): Promise<PlatformUser[]> {
    if (items.length === 0) {
      return [];
    }

    const platform = items[0].where.platform;

    const allSamePlatform = items.every(
      (item) => item.where.platform === platform,
    );

    if (!allSamePlatform) {
      throw new Error(
        'All items must have the same platform for batch upsert operation',
      );
    }

    const platformUuids = items.map((item) => item.where.platformUuid);

    const existingUsers = await this.prisma.platformUser.findMany({
      where: {
        platform,
        platformUuid: { in: platformUuids },
      },
    });

    const existingUserMap = new Map<string, PlatformUser>();
    existingUsers.forEach((user) => {
      if (user.platformUuid) {
        existingUserMap.set(user.platformUuid, user);
      }
    });

    const createItems: Prisma.PlatformUserCreateManyInput[] = [];
    const updateItems: Array<{
      id: string;
      data: Partial<
        Omit<
          PlatformUserUpdateInput,
          'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
        >
      >;
    }> = [];

    for (const item of items) {
      const existingUser = existingUserMap.get(item.where.platformUuid);

      if (existingUser) {
        updateItems.push({
          id: existingUser.id,
          data: {
            ...item.update,
            lastSeenAt: new Date(),
          },
        });
      } else {
        createItems.push({
          ...item.create,
          platform: item.where.platform,
          platformUuid: item.where.platformUuid,
          lastSeenAt: new Date(),
        });
      }
    }

    const results: PlatformUser[] = [];

    if (createItems.length > 0) {
      await this.prisma.platformUser.createMany({
        data: createItems,
        skipDuplicates: true,
      });

      const createdUsers = await this.prisma.platformUser.findMany({
        where: {
          platform,
          platformUuid: {
            in: createItems.map((item) => item.platformUuid as string),
          },
        },
      });

      results.push(...createdUsers);
    }

    if (updateItems.length > 0) {
      const updatedUsers = await Promise.all(
        updateItems.map((item) =>
          this.prisma.platformUser.update({
            where: { id: item.id },
            data: item.data,
          }),
        ),
      );

      results.push(...updatedUsers);
    }

    return results;
  }

  async findByPlatformAndId(
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

  async findByPlatformAndUuid(
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

  async findById(id: string): Promise<PlatformUser | null> {
    return this.prisma.platformUser.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<PlatformUser[]> {
    return this.prisma.platformUser.findMany({
      where: { userId },
    });
  }

  async findActiveByPlatform(platform: Platform): Promise<PlatformUser[]> {
    return this.prisma.platformUser.findMany({
      where: {
        platform,
        isActive: true,
      },
    });
  }

  async findManyByPlatformAndUuids(
    platform: Platform,
    platformUuids: string[],
  ): Promise<Map<string, PlatformUser>> {
    const users = await this.prisma.platformUser.findMany({
      where: {
        platform,
        platformUuid: { in: platformUuids },
      },
    });

    const userMap = new Map<string, PlatformUser>();
    users.forEach((user) => {
      if (user.platformUuid) {
        userMap.set(user.platformUuid, user);
      }
    });

    return userMap;
  }

  async updateLastSeenAt(id: string): Promise<PlatformUser> {
    return this.prisma.platformUser.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  async deactivateByPlatformUser(id: string): Promise<PlatformUser> {
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
