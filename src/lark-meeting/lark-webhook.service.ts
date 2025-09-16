import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LarkWebhookHandler {
  private readonly logger = new Logger(LarkWebhookHandler.name);

  verifySignature(): boolean {
    this.logger.log('验证 Lark Webhook 签名');
    return true;
  }

  decryptData(encryptedData: string): string {
    this.logger.log('解密 Lark Webhook 数据');
    return encryptedData;
  }

  handleEvent(): void {
    this.logger.log('处理 Lark Webhook 事件');
  }

  handleWebhookEvent(body?: unknown, headers?: Record<string, string>): void {
    this.logger.log('处理 Lark Webhook 事件');
    if (body) this.logger.debug('收到 Lark Webhook Body');
    if (headers) this.logger.debug('收到 Lark Webhook Headers');
    throw new Error('Lark Webhook 处理尚未实现');
  }
}
