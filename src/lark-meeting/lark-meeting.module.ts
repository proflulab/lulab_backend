import { Module } from '@nestjs/common';
import { LarkWebhookHandler } from './lark-webhook.service';
import { LarkWebhookController } from './lark-webhook.controller';
import { LarkModule } from '../integrations/lark/lark.module';

@Module({
  imports: [LarkModule],
  controllers: [LarkWebhookController],
  providers: [LarkWebhookHandler],
  exports: [LarkWebhookHandler],
})
export class LarkMeetingModule {}
