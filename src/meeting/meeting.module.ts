/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-07 03:42:31
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-01 07:22:37
 * @FilePath: /lulab_backend/src/meeting/meeting.module.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { MeetingRepository } from './repositories/meeting.repository';
import { MeetingFileRepository } from './repositories/meeting-file.repository';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { TencentModule } from '../integrations/tencent-meeting/tencent.module';

@Module({
  imports: [HttpModule, PrismaModule, TencentModule],
  controllers: [MeetingController],
  providers: [MeetingService, MeetingRepository, MeetingFileRepository],
  exports: [MeetingService, MeetingRepository, MeetingFileRepository],
})
export class MeetingModule {}
