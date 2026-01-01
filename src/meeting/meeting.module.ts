/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-07 03:42:31
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-01 20:32:53
 * @FilePath: /lulab_backend/src/meeting/meeting.module.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TencentModule } from '@/integrations';
import { PrismaModule } from '../prisma/prisma.module';
import { MeetingController } from './meeting.controller';
import { MeetingService, TencentRecordingSyncService } from './services';
import {
  MeetingRepository,
  MeetingFileRepository,
  MeetingRecordingRepository,
} from './repositories';

@Module({
  imports: [HttpModule, PrismaModule, TencentModule],
  controllers: [MeetingController],
  providers: [
    MeetingService,
    TencentRecordingSyncService,
    MeetingRepository,
    MeetingRecordingRepository,
    MeetingFileRepository,
  ],
  exports: [
    MeetingService,
    TencentRecordingSyncService,
    MeetingRepository,
    MeetingRecordingRepository,
    MeetingFileRepository,
  ],
})
export class MeetingModule {}
