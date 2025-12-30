import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GenerationMethod, ProcessingStatus, Prisma } from '@prisma/client';

@Injectable()
export class MeetingSummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMeetingSummary(data: {
    meetingId: string;
    recordingId: string;
    content: string;
    generatedBy?: GenerationMethod;
    aiModel?: string;
    status?: ProcessingStatus;
    processingTime?: number;
    language?: string;
    version?: number;
    isLatest?: boolean;
  }) {
    return this.prisma.meetingSummary.create({
      data: {
        meetingId: data.meetingId,
        recordingId: data.recordingId,
        content: data.content,
        generatedBy: data.generatedBy || GenerationMethod.AI,
        aiModel: data.aiModel || 'tencent-meeting-ai',
        status: data.status || ProcessingStatus.COMPLETED,
        processingTime: data.processingTime,
        language: data.language || 'zh-CN',
        version: data.version || 1,
        isLatest: data.isLatest !== undefined ? data.isLatest : true,
      },
    });
  }

  async upsertMeetingSummary(data: {
    meetingId: string;
    recordingId: string;
    content?: string;
    aiMinutes?: Prisma.InputJsonValue;
    actionItems?: Prisma.InputJsonValue;
    generatedBy?: GenerationMethod;
    aiModel?: string;
    status?: ProcessingStatus;
    processingTime?: number;
    language?: string;
    version?: number;
    isLatest?: boolean;
  }) {
    const existingSummary = await this.prisma.meetingSummary.findFirst({
      where: {
        meetingId: data.meetingId,
        recordingId: data.recordingId,
        isLatest: true,
      },
    });

    if (existingSummary) {
      return this.prisma.meetingSummary.update({
        where: { id: existingSummary.id },
        data: {
          content: data.content,
          aiMinutes: data.aiMinutes,
          actionItems: data.actionItems,
          generatedBy: data.generatedBy,
          aiModel: data.aiModel,
          status: data.status,
          processingTime: data.processingTime,
          language: data.language,
          updatedAt: new Date(),
        },
      });
    } else {
      return this.prisma.meetingSummary.create({
        data: {
          meetingId: data.meetingId,
          recordingId: data.recordingId,
          content: data.content || '',
          aiMinutes: data.aiMinutes,
          actionItems: data.actionItems,
          generatedBy: data.generatedBy || GenerationMethod.AI,
          aiModel: data.aiModel || 'tencent-meeting-ai',
          status: data.status || ProcessingStatus.COMPLETED,
          processingTime: data.processingTime,
          language: data.language || 'zh-CN',
          version: data.version || 1,
          isLatest: data.isLatest !== undefined ? data.isLatest : true,
        },
      });
    }
  }
}
