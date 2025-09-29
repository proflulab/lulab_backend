/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-01-03 10:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-09-03 02:41:47
 * @FilePath: /lulab_backend/src/tencent-meeting/tencent-meeting.module.ts
 * @Description: 腾讯会议模块
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { TencentWebhookController } from './controllers/tencent-webhook.controller';
import { TencentMeetingService } from './services/tencent-meeting.service';
import { TencentModule } from '../integrations/tencent-meeting/tencent.module';
import { TencentEventHandlerService } from './services/tencent-event-handler.service';
import { LarkModule } from '../integrations/lark/lark.module';
import { EventHandlerFactory } from './services/event-handlers/event-handler.factory';
import { MeetingStartedHandler } from './services/event-handlers/meeting-started.handler';
import { MeetingEndedHandler } from './services/event-handlers/meeting-ended.handler';
import { RecordingCompletedHandler } from './services/event-handlers/recording-completed.handler';
import { MeetingParticipantJoinedHandler } from './services/event-handlers/meeting-participant-joined.handler';
import { TencentMeetingConfigService } from './services/tencent-config.service';

@Module({
  imports: [LarkModule, TencentModule],
  controllers: [TencentWebhookController],
  providers: [
    TencentMeetingService,
    TencentEventHandlerService,
    TencentMeetingConfigService,
    EventHandlerFactory,
    MeetingStartedHandler,
    MeetingEndedHandler,
    RecordingCompletedHandler,
    MeetingParticipantJoinedHandler,
  ],
  exports: [TencentMeetingService],
})
export class TencentMeetingModule {}
