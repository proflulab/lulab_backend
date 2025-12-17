import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateMeetingRecordData,
  UpdateMeetingRecordData,
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
    return this.prisma.meeting.findUnique({
      where: {
        platform_meetingId: {
          platform,
          meetingId: platformMeetingId,
        },
      },
    });
  }

  /**
   * 根据ID查找会议记录
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
   * 创建会议记录
   */
  async createMeetingRecord(data: CreateMeetingRecordData) {
    return this.prisma.meeting.create({
      data,
    });
  }

  /**
   * 更新会议记录
   */
  async updateMeetingRecord(id: string, data: UpdateMeetingRecordData) {
    return this.prisma.meeting.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除会议记录
   */
  async deleteMeetingRecord(id: string) {
    return this.prisma.meeting.delete({
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
}
