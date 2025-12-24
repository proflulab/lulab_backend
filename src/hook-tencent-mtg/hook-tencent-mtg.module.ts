/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-01-03 10:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-24 05:01:43
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/hook-tencent-mtg.module.ts
 * @Description: 腾讯会议模块，处理腾讯会议相关的Webhook事件
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { tencentMeetingConfig } from '../configs/tencent-mtg.config';

import { PrismaModule } from '../prisma/prisma.module';
import { LarkModule } from '../integrations/lark/lark.module';
import { OpenaiModule } from '../integrations/openai/openai.module';
import { TencentModule } from '../integrations/tencent-meeting/tencent.module';

import { TencentWebhookController } from './controllers/tencent-webhook.controller';
import { TencentEventHandlerService } from './services/event-handler.service';
import { MeetingBitableService } from './services/meeting-bitable.service';
import { MeetingDatabaseService } from './services/meeting-database.service';
import { MeetingRepository } from '../meeting/repositories/meeting.repository';
import { PlatformUserRepository } from '../user-platform/repositories/platform-user.repository';
import { TencentMeetingRepository } from './repositories/tencent-meeting.repository';

import {
  TencentUrlVerificationPipe,
  TencentWebhookDecryptionPipe,
} from './pipes';
import {
  MeetingStartedHandler,
  EventHandlerFactory,
  MeetingEndedHandler,
  RecordingCompletedHandler,
  MeetingParticipantJoinedHandler,
} from './handlers';

@Module({
  imports: [
    ConfigModule.forFeature(tencentMeetingConfig),
    LarkModule,
    TencentModule,
    OpenaiModule,
    PrismaModule,
  ],
  controllers: [TencentWebhookController],
  providers: [
    TencentEventHandlerService,
    EventHandlerFactory,
    MeetingBitableService,
    MeetingDatabaseService,
    MeetingStartedHandler,
    MeetingEndedHandler,
    RecordingCompletedHandler,
    MeetingParticipantJoinedHandler,
    PlatformUserRepository,
    MeetingRepository,
    TencentMeetingRepository,
    TencentUrlVerificationPipe,
    TencentWebhookDecryptionPipe,
    // 提供 BaseEventHandler 数组的依赖注入配置
    {
      provide: 'BaseEventHandler[]',
      useFactory: (
        meetingStartedHandler: MeetingStartedHandler,
        meetingEndedHandler: MeetingEndedHandler,
        recordingCompletedHandler: RecordingCompletedHandler,
        meetingParticipantJoinedHandler: MeetingParticipantJoinedHandler,
      ) => [
        meetingStartedHandler,
        meetingEndedHandler,
        recordingCompletedHandler,
        meetingParticipantJoinedHandler,
      ],
      inject: [
        MeetingStartedHandler,
        MeetingEndedHandler,
        RecordingCompletedHandler,
        MeetingParticipantJoinedHandler,
      ],
    },
  ],
})
export class HookTencentMtgModule {}
