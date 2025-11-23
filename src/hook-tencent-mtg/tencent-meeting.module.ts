/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-01-03 10:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-01 06:26:26
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/tencent-meeting.module.ts
 * @Description: 腾讯会议模块，处理腾讯会议相关的Webhook事件
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TencentWebhookController } from './controllers/tencent-webhook.controller';
import { TencentModule } from '../integrations/tencent-meeting/tencent.module';
import { TencentEventHandlerService } from './services/tencent-event-handler.service';
import { LarkModule } from '../integrations/lark/lark.module';
import { EventHandlerFactory } from './services/event-handlers/event-handler.factory';
import { MeetingStartedHandler } from './services/event-handlers/meeting-started.handler';
import { MeetingEndedHandler } from './services/event-handlers/meeting-ended.handler';
import { RecordingCompletedHandler } from './services/event-handlers/recording-completed.handler';
import { MeetingParticipantJoinedHandler } from './services/event-handlers/meeting-participant-joined.handler';
import { tencentMeetingConfig } from '../configs/tencent-mtg.config';
import { OpenaiModule } from '../integrations/openai/openai.module';
import { MeetingModule } from '@/meeting/meeting.module';
import { TencentUrlVerificationPipe } from './pipes/tencent-url-verification.pipe';

@Module({
  imports: [
    ConfigModule.forFeature(tencentMeetingConfig),
    LarkModule,
    TencentModule,
    OpenaiModule,
    MeetingModule,
  ],
  controllers: [TencentWebhookController],
  providers: [
    TencentEventHandlerService,
    EventHandlerFactory,
    MeetingStartedHandler,
    MeetingEndedHandler,
    RecordingCompletedHandler,
    MeetingParticipantJoinedHandler,
    TencentUrlVerificationPipe,
  ],
})
export class TencentMeetingModule {}
