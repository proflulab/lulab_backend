import { Module } from '@nestjs/common';
import { LarkWebhookHandler } from './service/lark-webhook.service';
import { LarkWebhookController } from './controllers/webhook.controller';
import { LarkEventWsService } from './service/lark-event-ws.service';
import { LarkMeetingRecordingService } from './service/lark-meeting-recording.service';
import { MinuteTranscriptService } from './service/lark-minute-transript.service';
import { LarkModule } from '../integrations/lark/lark.module';
import { LarkMeetingDetailService } from './service/lark-meeting-detail.service';
import { LarkMeetingWriterService } from './service/lark-meeting-writer.service';
import { LarkMeetingCacheService } from './service/lark-meeting-cache.service';

@Module({
  imports: [LarkModule],
  controllers: [LarkWebhookController],
  providers: [
    LarkWebhookHandler,
    LarkEventWsService,
    LarkMeetingRecordingService,
    MinuteTranscriptService,
    LarkMeetingDetailService,
    LarkMeetingWriterService,
    LarkMeetingCacheService,
  ],
  exports: [
    LarkWebhookHandler,
    MinuteTranscriptService,
    LarkMeetingDetailService,
    LarkMeetingWriterService,
    LarkMeetingCacheService,
  ],
})
export class LarkMeetingModule {}
