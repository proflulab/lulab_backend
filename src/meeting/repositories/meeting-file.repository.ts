/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-17 21:09:15
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-17 21:14:19
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

  /**
   * 创建会议文件
   */
  async createMeetingFile(data: CreateMeetingFileData) {
    return this.prisma.meetingRecordingFile.create({
      data,
    });
  }

  /**
   * 更新会议文件
   */
  async updateMeetingFile(id: string, data: UpdateMeetingFileData) {
    return this.prisma.meetingRecordingFile.update({
      where: { id },
      data,
    });
  }
}
