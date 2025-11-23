/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-22 23:46:35
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-23 11:19:04
 * @FilePath: /lulab_backend/src/lark-meeting/lark-meeting.module.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LarkWebhookHandler } from './service/lark-webhook.service';
import { LarkWebhookController } from './controllers/webhook.controller';
import { LarkEventWsService } from './service/lark-event-ws.service';
import { LarkMeetingRecordingService } from './service/lark-meeting-recording.service';
import { MinuteTranscriptService } from './service/lark-minute-transript.service';
import { LarkModule } from '../integrations/lark/lark.module';
import { LarkMeetingDetailService } from './service/lark-meeting-detail.service';
import { LarkMeetingWriterService } from './service/lark-meeting-writer.service';
import { LarkMeetingCacheService } from './service/lark-meeting-cache.service';
import { LarkMeetingService } from './service/lark-meeting.service';
import { LarkEventProcessor } from './queue/lark-event.processor';
import { BullModule } from '@nestjs/bullmq';
import { larkConfig } from '@/configs/lark.config';

@Module({
  imports: [
    LarkModule,
    ConfigModule.forFeature(larkConfig),
    BullModule.registerQueue({ name: 'lark-events' }),
  ],
  controllers: [LarkWebhookController],
  providers: [
    LarkWebhookHandler,
    LarkEventWsService,
    LarkMeetingRecordingService,
    MinuteTranscriptService,
    LarkMeetingDetailService,
    LarkMeetingWriterService,
    LarkMeetingCacheService,
    LarkMeetingService,
    LarkEventProcessor,
  ],
  exports: [
    LarkWebhookHandler,
    MinuteTranscriptService,
    LarkMeetingDetailService,
    LarkMeetingWriterService,
    LarkMeetingCacheService,
    LarkMeetingService,
  ],
})
export class LarkMeetingModule {}
