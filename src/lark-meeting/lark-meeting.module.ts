import { Module } from '@nestjs/common';
import { LarkWebhookHandler } from './lark-webhook.service';
import { LarkWebhookController } from './lark-webhook.controller';
import { LarkEventWsService } from './lark-event-ws.service';
import { LarkMeetingRecordingService } from './lark-meeting-recording.service';
import { MinuteTranscriptService } from './lark-minute-transript.service';
import { LarkModule } from '../integrations/lark/lark.module';
import { LarkMeetingDetailService } from './lark-meeting-detail.service';
import { LarkMeetingWriterService } from './lark-meeting-writer.service';
import { LarkMeetingCacheService } from './lark-meeting-cache.service';

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
