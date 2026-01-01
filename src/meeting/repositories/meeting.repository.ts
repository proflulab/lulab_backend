import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type {
  CreateMeetingRecordData,
  UpdateMeetingRecordData,
  GetMeetingRecordsParams,
} from '@/meeting/types';
import {
  MeetingPlatform,
  RecordingSource,
  RecordingStatus,
} from '@prisma/client';

@Injectable()
export class MeetingRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find meeting record by platform and meeting ID
   */
  async findMeetingByPlatformId(
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
   * Find meeting record by ID
   */
  async findMeetingById(id: string) {
    return this.prisma.meeting.findUnique({
      where: { id },
      include: {
        recordings: true,
      },
    });
  }

  /**
   * Create meeting record
   */
  async createMeetingRecord(data: CreateMeetingRecordData) {
    return this.prisma.meeting.create({
      data,
    });
  }

  /**
   * Update meeting record
   */
  async updateMeetingRecord(id: string, data: UpdateMeetingRecordData) {
    return this.prisma.meeting.update({
      where: { id },
      data,
    });
  }

  /**
   * Upsert meeting record - create if not exists, update if exists
   */
  async upsertMeetingRecord(
    platform: MeetingPlatform,
    meetingId: string,
    subMeetingId: string,
    data: Omit<
      CreateMeetingRecordData,
      'platform' | 'meetingId' | 'subMeetingId'
    >,
  ) {
    return this.prisma.meeting.upsert({
      where: {
        platform_meetingId_subMeetingId: {
          platform,
          meetingId,
          subMeetingId,
        },
      },
      update: data,
      create: {
        platform,
        meetingId,
        subMeetingId,
        ...data,
      },
    });
  }

  /**
   * Delete meeting record
   */
  async deleteMeetingRecord(id: string) {
    return this.prisma.meeting.delete({
      where: { id },
    });
  }

  /**
   * Get meeting records list
   */
  async getMeetingRecords(params: GetMeetingRecordsParams): Promise<{
    records: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { platform, startDate, endDate, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: {
      platform?: typeof platform;
      startTime?: { gte?: Date; lte?: Date };
    } = {};
    if (platform) {
      where.platform = platform;
    }
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = startDate;
      }
      if (endDate) {
        where.startTime.lte = endDate;
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        include: {
          recordings: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
    metadata?: Prisma.InputJsonValue;
  }) {
    const existingRecording = await this.prisma.meetingRecording.findFirst({
      where: {
        meetingId: data.meetingId,
        externalId: data.externalId,
      },
    });

    if (existingRecording) {
      return this.prisma.meetingRecording.update({
        where: { id: existingRecording.id },
        data: {
          source: data.source,
          status: data.status,
          startAt: data.startAt,
          endAt: data.endAt,
          metadata: data.metadata,
          updatedAt: new Date(),
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
          metadata: data.metadata,
        },
      });
    }
  }
}
