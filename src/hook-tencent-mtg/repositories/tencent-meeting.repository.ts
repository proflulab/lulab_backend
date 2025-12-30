import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  MeetingPlatform,
  Platform,
  PrismaClient,
  MeetingType,
  ProcessingStatus,
  RecordingSource,
  RecordingStatus,
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
    platformUuid: string,
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
        platformUuid,
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
          platformUuid,
          platformUserId: data.platformUserId,
          userName: data.userName,
          email: data.email,
          platformData: data.platformData,
          lastSeenAt: new Date(),
          isActive: true,
        },
      });
    }
  }

  /**
   * Find meeting by platform and meeting identifiers
   */
  async findMeeting(
    platform: MeetingPlatform,
    meetingId: string,
    subMeetingId: string,
  ) {
    return this.prisma.meeting.findUnique({
      where: {
        platform_meetingId_subMeetingId: {
          platform,
          meetingId,
          subMeetingId,
        },
      },
    });
  }

  /**
   * Find recording by meeting ID and external ID
   */
  async findRecording(meetingId: string, externalId: string) {
    return this.prisma.meetingRecording.findFirst({
      where: {
        meetingId,
        externalId,
      },
    });
  }

  /**
   * Upsert meeting recording
   */
  async upsertMeetingRecording(data: {
    meetingId: string;
    externalId: string;
    source?: RecordingSource;
    status?: RecordingStatus;
    startAt?: Date;
    endAt?: Date;
  }) {
    const existingRecording = await this.findRecording(
      data.meetingId,
      data.externalId,
    );

    if (existingRecording) {
      return this.prisma.meetingRecording.update({
        where: { id: existingRecording.id },
        data: {
          source: data.source,
          status: data.status,
          startAt: data.startAt,
          endAt: data.endAt,
        },
      });
    } else {
      return this.prisma.meetingRecording.create({
        data: {
          meetingId: data.meetingId,
          externalId: data.externalId,
          source: data.source || RecordingSource.PLATFORM_AUTO,
          status: data.status || RecordingStatus.COMPLETED,
          startAt: data.startAt,
          endAt: data.endAt,
        },
      });
    }
  }

  /**
   * Find or create recording by file ID
   */
  async findOrCreateRecordingByFileId(
    tx: PrismaTransaction,
    recordFileId: string,
    meetingId?: string,
    subMeetingId?: string,
  ): Promise<string> {
    const recording = await tx.meetingRecording.findFirst({
      where: {
        externalId: recordFileId,
      },
    });

    if (recording) {
      return recording.id;
    }

    const meetingIdToUse = meetingId;

    if (!meetingIdToUse) {
      throw new Error('Meeting ID is required when creating a new recording');
    }

    const meeting = await tx.meeting.findFirst({
      where: {
        platform: 'TENCENT_MEETING',
        meetingId: meetingIdToUse,
        subMeetingId: subMeetingId || '__ROOT__',
      },
    });

    if (!meeting) {
      throw new Error(
        `Meeting not found for meetingId: ${meetingIdToUse}, subMeetingId: ${subMeetingId || '__ROOT__'}`,
      );
    }

    const existingMeetingId = meeting.id;

    const newRecording = await tx.meetingRecording.create({
      data: {
        externalId: recordFileId,
        source: RecordingSource.PLATFORM_AUTO,
        status: RecordingStatus.COMPLETED,
        meetingId: existingMeetingId,
        metadata: {
          autoCreated: true,
        },
      },
    });

    return newRecording.id;
  }
}
