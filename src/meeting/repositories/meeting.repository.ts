import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  MeetingPlatform,
  MeetingType,
  FileType,
  StorageType,
  ProcessingStatus,
} from '@prisma/client';

export interface CreateMeetingRecordData {
  platform: MeetingPlatform;
  platformMeetingId: string;
  title: string;
  meetingCode: string;
  type: MeetingType;
  hostUserId: string;
  hostUserName: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  hasRecording: boolean;
  recordingStatus: ProcessingStatus;
  processingStatus: ProcessingStatus;
  metadata?: any;
}

export interface UpdateMeetingRecordData {
  recordingStatus?: ProcessingStatus;
  processingStatus?: ProcessingStatus;
  participantCount?: number;
  participantList?: any;
  transcript?: string;
  summary?: string;
}

export interface CreateMeetingFileData {
  meetingRecordId: string;
  fileName: string;
  fileType: FileType;
  storageType: StorageType;
  downloadUrl?: string;
  content?: string;
  mimeType: string;
  processingStatus: ProcessingStatus;
}

export interface UpdateMeetingFileData {
  fileName?: string;
  content?: string;
  processingStatus?: ProcessingStatus;
  metadata?: any;
}

export interface GetMeetingRecordsParams {
  platform?: MeetingPlatform;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class MeetingRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据平台和会议ID查找会议记录
   */
  async findMeetingByPlatformId(
    platform: MeetingPlatform,
    platformMeetingId: string,
  ) {
    return this.prisma.meetings.findUnique({
      where: {
        platform_platformMeetingId: {
          platform,
          platformMeetingId,
        },
      },
    });
  }

  /**
   * 根据ID查找会议记录
   */
  async findMeetingById(id: string) {
    return this.prisma.meetings.findUnique({
      where: { id },
      include: {
        files: true,
      },
    });
  }

  /**
   * 创建会议记录
   */
  async createMeetingRecord(data: CreateMeetingRecordData) {
    return this.prisma.meetings.create({
      data,
    });
  }

  /**
   * 更新会议记录
   */
  async updateMeetingRecord(id: string, data: UpdateMeetingRecordData) {
    return this.prisma.meetings.update({
      where: { id },
      data,
    });
  }

  /**
   * 创建会议文件
   */
  async createMeetingFile(data: CreateMeetingFileData) {
    return this.prisma.meetingFile.create({
      data,
    });
  }

  /**
   * 更新会议文件
   */
  async updateMeetingFile(id: string, data: UpdateMeetingFileData) {
    return this.prisma.meetingFile.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除会议记录
   */
  async deleteMeetingRecord(id: string) {
    return this.prisma.meetings.delete({
      where: { id },
    });
  }

  /**
   * 获取会议记录列表
   */
  async getMeetingRecords(params: GetMeetingRecordsParams) {
    const { platform, startDate, endDate, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
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
      this.prisma.meetings.findMany({
        where,
        include: {
          files: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.meetings.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
