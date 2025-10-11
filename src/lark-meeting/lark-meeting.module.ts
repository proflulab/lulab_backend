import { Module } from '@nestjs/common';
import { LarkWebhookHandler } from './lark-webhook.service';
import { LarkWebhookController } from './lark-webhook.controller';
import { LarkEventWsService } from './lark-event-ws.service';
import { LarkMeetingRecordingService } from './lark-meeting-recording.service';
import { MinuteTranscriptService } from './lark-minute-transript.service';
import { LarkModule } from '../integrations/lark/lark.module';

@Module({
  imports: [LarkModule],
  controllers: [LarkWebhookController],
  providers: [
    LarkWebhookHandler,
    LarkEventWsService,
    LarkMeetingRecordingService,
    MinuteTranscriptService,
  ],
  exports: [LarkWebhookHandler, MinuteTranscriptService],
})
export class LarkMeetingModule {}
