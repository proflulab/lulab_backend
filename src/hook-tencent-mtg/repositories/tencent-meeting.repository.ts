import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  MeetingPlatform,
  Platform,
  PrismaClient,
  MeetingType,
  ProcessingStatus,
  Prisma,
} from '@prisma/client';

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

interface CreateMeetingRecordData {
  title: string;
  description?: string;
  meetingCode?: string;
  type?: MeetingType;
  language?: string;
  tags?: string[];
  scheduledStartAt?: Date;
  scheduledEndAt?: Date;
  startAt?: Date;
  endAt?: Date;
  durationSeconds?: number;
  timezone?: string;
  hasRecording?: boolean;
  recordingStatus?: ProcessingStatus;
  processingStatus?: ProcessingStatus;
  participantCount?: number;
  metadata?: Prisma.InputJsonValue;
}

/**
 * 腾讯会议仓储层
 * 处理腾讯会议相关的数据库操作
 */
@Injectable()
export class TencentMeetingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upsert meeting record with platform users - create/update meeting and associated platform users
   */
  async upsertMeetingWithPlatformUsers(
    platform: MeetingPlatform,
    meetingId: string,
    subMeetingId: string,
    meetingData: CreateMeetingRecordData,
    creatorData: {
      platformUuid: string;
      platformUserId?: string;
      platform: Platform;
      userName?: string;
      email?: string;
      platformData?: Prisma.InputJsonValue;
    },
    hostData: {
      platformUuid: string;
      platformUserId?: string;
      platform: Platform;
      userName?: string;
      email?: string;
      platformData?: Prisma.InputJsonValue;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Upsert creator platform user
      const creatorUser = await this.upsertPlatformUserByUuid(
        tx,
        creatorData.platform,
        creatorData.platformUuid,
        {
          platformUserId: creatorData.platformUserId,
          userName: creatorData.userName,
          email: creatorData.email,
          platformData: creatorData.platformData,
        },
      );

      // Upsert host platform user
      const hostUser = await this.upsertPlatformUserByUuid(
        tx,
        hostData.platform,
        hostData.platformUuid,
        {
          platformUserId: hostData.platformUserId,
          userName: hostData.userName,
          email: hostData.email,
          platformData: hostData.platformData,
        },
      );

      // Upsert meeting with user references
      const meeting = await tx.meeting.upsert({
        where: {
          platform_meetingId_subMeetingId: {
            platform,
            meetingId,
            subMeetingId,
          },
        },
        update: {
          ...meetingData,
          createdById: creatorUser.id,
          hostId: hostUser.id,
        },
        create: {
          platform,
          meetingId,
          subMeetingId,
          ...meetingData,
          createdById: creatorUser.id,
          hostId: hostUser.id,
        },
      });

      return {
        meeting,
        creatorUser,
        hostUser,
      };
    });
  }

  /**
   * Helper method to upsert a platform user by UUID
   */
  private async upsertPlatformUserByUuid(
    tx: PrismaTransaction,
    platform: Platform,
    ptUnionId: string,
    data: {
      platformUserId?: string;
      userName?: string;
      email?: string;
      platformData?: Prisma.InputJsonValue;
    },
  ) {
    const existingUser = await tx.platformUser.findFirst({
      where: {
        platform,
        ptUnionId,
      },
    });

    if (existingUser) {
      return tx.platformUser.update({
        where: { id: existingUser.id },
        data: {
          ...data,
          lastSeenAt: new Date(),
        },
      });
    } else {
      return tx.platformUser.create({
        data: {
          platform,
          ptUnionId,
          ptUserId: data.platformUserId,
          displayName: data.userName,
          email: data.email,
          platformData: data.platformData,
          lastSeenAt: new Date(),
          active: true,
        },
      });
    }
  }
}
