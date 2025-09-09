/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-01-03 10:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-09-03 02:41:47
 * @FilePath: /lulab_backend/src/tencent_meeting/tencent-meeting.module.ts
 * @Description: 腾讯会议模块
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TencentWebhookController } from './controllers/tencent-webhook.controller';
import { TencentMeetingService } from './services/tencent-meeting.service';
import { TencentApiService } from './services/tencent-api.service';
import { TencentEventHandlerService } from './services/tencent-event-handler.service';
import { MeetingRepository } from '../meeting/repositories/meeting.repository';
import { PrismaService } from '../prisma.service';
import { LarkModule } from '../../libs/integrations-lark/lark.module';
import { EventHandlerFactory } from './services/event-handlers/event-handler.factory';
import { MeetingStartedHandler } from './services/event-handlers/meeting-started.handler';
import { MeetingEndedHandler } from './services/event-handlers/meeting-ended.handler';
import { RecordingCompletedHandler } from './services/event-handlers/recording-completed.handler';

@Module({
  imports: [HttpModule, LarkModule],
  controllers: [TencentWebhookController],
  providers: [
    TencentMeetingService,
    TencentApiService,
    TencentEventHandlerService,
    EventHandlerFactory,
    MeetingStartedHandler,
    MeetingEndedHandler,
    RecordingCompletedHandler,
    MeetingRepository,
    PrismaService,
  ],
  exports: [
    TencentMeetingService,
    TencentApiService,
  ],
})
export class TencentMeetingModule { }