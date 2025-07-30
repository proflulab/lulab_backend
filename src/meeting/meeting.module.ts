/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-07 03:42:31
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-30 15:36:00
 * @FilePath: /lulab_backend/src/meeting/meeting.module.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { Module } from '@nestjs/common';
import { MeetingController } from './controllers/meeting.controller';
import { MeetingService } from './services/meeting.service';
import { MeetingRepository } from './repositories/meeting.repository';
import { TencentMeetingService } from './services/platforms/tencent/tencent-meeting.service';
import { TencentApiService } from './services/platforms/tencent/tencent-api.service';
import { TencentConfigService } from './services/platforms/tencent/tencent-config.service';
import { TencentEventValidator } from './services/platforms/tencent/tencent-event-validator.service';
import { TencentEventHandlerFactory } from './services/platforms/tencent/handlers/event-handler-factory';
import { RecordingCompletedHandler } from './services/platforms/tencent/handlers/recording-completed-handler';
import { MeetingStartedHandler } from './services/platforms/tencent/handlers/meeting-started-handler';
import { MeetingEndedHandler } from './services/platforms/tencent/handlers/meeting-ended-handler';
import { TencentWebhookController } from './controllers/tencent-webhook.controller';
import { FeishuWebhookController } from './controllers/feishu-webhook.controller';
import { FeishuWebhookHandler } from './services/platforms/feishu/feishu-webhook.service';
import { HttpModule } from '@nestjs/axios';
import { WebhookLoggingInterceptor } from './interceptors/webhook-logging.interceptor';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    HttpModule,
  ],
  controllers: [
    MeetingController,
    TencentWebhookController,
    FeishuWebhookController,
  ],
  providers: [
    MeetingService,
    MeetingRepository,
    TencentMeetingService,
    TencentApiService,
    TencentConfigService,
    TencentEventValidator,
    TencentEventHandlerFactory,
    RecordingCompletedHandler,
    MeetingStartedHandler,
    MeetingEndedHandler,
    FeishuWebhookHandler,
    WebhookLoggingInterceptor,

    PrismaService,
  ],
  exports: [MeetingService],
})
export class MeetingModule { }