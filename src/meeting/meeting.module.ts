/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-07 03:42:31
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-09-03 02:51:23
 * @FilePath: /lulab_backend/src/meeting/meeting.module.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { MeetingRepository } from './repositories/meeting.repository';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [MeetingController],
  providers: [MeetingService, MeetingRepository],
  exports: [MeetingService, MeetingRepository],
})
export class MeetingModule {}
