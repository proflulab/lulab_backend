/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-22 23:46:35
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-23 18:26:43
 * @FilePath: /lulab_backend/src/lark-meeting/lark-meeting.module.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LarkWebhookController } from './controllers/webhook.controller';
import { LarkEventWsService } from './service/lark-event-ws.service';
import { LarkModule } from '../integrations/lark/lark.module';
import { LarkMeetingDetailService } from './service/lark-meeting-detail.service';
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
    LarkEventWsService,
    LarkMeetingDetailService,
    LarkMeetingService,
    LarkEventProcessor,
  ],
  exports: [LarkMeetingDetailService, LarkMeetingService],
})
export class LarkMeetingModule {}
