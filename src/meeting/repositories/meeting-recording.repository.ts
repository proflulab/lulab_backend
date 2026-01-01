/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-01 19:54:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-01 19:55:04
 * @FilePath: /lulab_backend/src/meeting/repositories/meeting-recording.repository.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, RecordingSource, RecordingStatus } from '@prisma/client';

@Injectable()
export class MeetingRecordingRepository {
  constructor(private prisma: PrismaService) {}

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
