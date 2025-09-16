import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type {
  CreateMeetingRecordData,
  UpdateMeetingRecordData,
  CreateMeetingFileData,
  UpdateMeetingFileData,
  GetMeetingRecordsParams,
} from '@/meeting/types/meeting.types';
import { MeetingPlatform } from '@prisma/client';

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
