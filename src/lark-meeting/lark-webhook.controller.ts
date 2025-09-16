import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LarkWebhookHandler } from './lark-webhook.service';

@ApiTags('Webhooks')
@Controller('webhooks/lark')
export class LarkWebhookController {
  private readonly logger = new Logger(LarkWebhookController.name);

  constructor(private readonly handler: LarkWebhookHandler) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lark Webhook',
    description: '接收 Lark Webhook 事件',
  })
  @ApiResponse({ status: 200, description: 'Webhook 处理成功' })
  handleLarkWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ): void {
    this.logger.log('收到 Lark Webhook 请求');
    this.handler.handleWebhookEvent(body, headers);
  }
}
