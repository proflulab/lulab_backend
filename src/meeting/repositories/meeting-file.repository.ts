/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-15 10:25:48
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-15 10:36:10
 * @FilePath: /lulab_backend/src/meeting/repositories/meeting-file.repository.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateMeetingFileData,
  UpdateMeetingFileData,
} from '@/meeting/types/meeting.types';

@Injectable()
export class MeetingFileRepository {
  constructor(private prisma: PrismaService) {}

  async createMeetingFile(data: CreateMeetingFileData) {
    return this.prisma.meetingFile.create({
      data,
    });
  }

  async updateMeetingFile(id: string, data: UpdateMeetingFileData) {
    return this.prisma.meetingFile.update({
      where: { id },
      data,
    });
  }
}
