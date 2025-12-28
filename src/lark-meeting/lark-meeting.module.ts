import { Module } from '@nestjs/common';
import { LarkWebhookHandler } from './lark-webhook.service';
import { LarkWebhookController } from './lark-webhook.controller';

@Module({
  controllers: [LarkWebhookController],
  providers: [LarkWebhookHandler],
  exports: [LarkWebhookHandler],
})
export class LarkMeetingModule {}
