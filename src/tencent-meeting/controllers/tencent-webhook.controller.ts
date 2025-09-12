import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { TencentEventHandlerService } from '../services/tencent-event-handler.service';
import { TencentWebhookEventBodyDto } from '../dto/tencent-webhook-body.dto';
import { WebhookLoggingInterceptor } from '../interceptors/webhook-logging.interceptor';
import {
  ApiTencentUrlVerificationDocs,
  ApiTencentEventReceiverDocs,
} from '../decorators/tencent-webhook.decorators';
import {
  verifySignature,
  aesDecrypt,
  verifyWebhookUrl,
} from '../services/tencent-crypto.service';
import { TencentMeetingEvent } from '../types/tencent-webhook-events.types';
import {
  WebhookSignatureVerificationException,
  WebhookDecryptionException,
  WebhookConfigException,
} from '../exceptions/webhook.exceptions';
import { Public } from '../../auth/decorators/public.decorator';

/**
 * Tencent Meeting Webhook Controller
 * Specifically handles Tencent Meeting webhook requests
 */
@ApiTags('Webhooks')
@Controller('webhooks/tencent')
@Public()
@UseInterceptors(WebhookLoggingInterceptor)
export class TencentWebhookController {
  private readonly logger = new Logger(TencentWebhookController.name);

  constructor(
    private readonly tencentEventHandlerService: TencentEventHandlerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 获取并验证腾讯会议配置
   */
  private getTencentMeetingConfig(): { token: string; encodingAesKey: string } {
    const token = this.configService.get<string>('TENCENT_MEETING_TOKEN');
    if (!token) {
      throw new WebhookConfigException(
        'TENCENT_MEETING',
        'TENCENT_MEETING_TOKEN',
      );
    }

    const encodingAesKey = this.configService.get<string>(
      'TENCENT_MEETING_ENCODING_AES_KEY',
    );
    if (!encodingAesKey) {
      throw new WebhookConfigException(
        'TENCENT_MEETING',
        'TENCENT_MEETING_ENCODING_AES_KEY',
      );
    }

    return { token, encodingAesKey };
  }

  /**
   * Tencent Meeting Webhook URL verification endpoint (GET)
   * Used for Tencent Meeting webhook URL validity verification
   *
   * 腾讯会议通过GET请求验证URL有效性，参数通过Header传递：
   * - timestamp: 时间戳
   * - nonce: 随机数
   * - signature: 签名
   * - check_str: URL参数中的验证字符串
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiTencentUrlVerificationDocs()
  async verifyTencentWebhook(
    @Query('check_str') checkStr: string,
    @Headers('timestamp') timestamp: string,
    @Headers('nonce') nonce: string,
    @Headers('signature') signature: string,
  ): Promise<string> {
    this.logger.log(
      'Received Tencent Meeting Webhook URL verification request',
    );

    try {
      // URL解码所有参数
      const decodedCheckStr = decodeURIComponent(checkStr);
      const decodedTimestamp = decodeURIComponent(timestamp);
      const decodedNonce = decodeURIComponent(nonce);
      const decodedSignature = decodeURIComponent(signature);

      const { token, encodingAesKey } = this.getTencentMeetingConfig();
      return await verifyWebhookUrl(
        decodedCheckStr,
        decodedTimestamp,
        decodedNonce,
        decodedSignature,
        token,
        encodingAesKey,
      );
    } catch (error) {
      this.logger.error(
        'Failed to handle Tencent Meeting Webhook URL verification',
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Tencent Meeting Webhook event receiving endpoint (POST)
   * Supports event reception
   *
   * 根据腾讯会议文档要求：
   * - 支持HTTP POST请求接收事件消息回调
   * - 需要对signature进行校验
   * - 需要对data先进行base64解码，再用加密密钥解密
   * - 正确响应：HTTP 200，内容为"successfully received callback"（不能加引号、换行符）
   * - 腾讯会议在5秒内接收不到响应会重试三次（1分钟、3分钟、6分钟后）
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiTencentEventReceiverDocs()
  async handleTencentWebhook(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: TencentWebhookEventBodyDto,
    @Headers('timestamp') timestamp: string,
    @Headers('nonce') nonce: string,
    @Headers('signature') signature: string,
  ): Promise<string> {
    this.logger.log('Received Tencent Meeting Webhook request');

    try {
      // Event notification request
      if (body && body.data) {
        this.logger.log('Handling Tencent Meeting event notification');

        if (!signature || !timestamp || !nonce) {
          this.logger.error('Missing required signature headers', {
            signature: !!signature,
            timestamp: !!timestamp,
            nonce: !!nonce,
          });
          // 返回400会导致腾讯会议重试，这里直接返回失败响应
          throw new BadRequestException('Missing required signature headers');
        }

        // Process encrypted event data from body.data field
        const encryptedData = body.data;

        // Verify signature using the encrypted data
        const { token, encodingAesKey } = this.getTencentMeetingConfig();
        const isValid = verifySignature(
          token,
          timestamp,
          nonce,
          encryptedData,
          signature,
        );

        if (!isValid) {
          this.logger.error('Signature verification failed', {
            token,
            timestamp,
            nonce,
            signature,
          });
          throw new WebhookSignatureVerificationException('TENCENT_MEETING');
        }

        // Decrypt data (base64解码 + AES解密)
        let decryptedData: string;
        try {
          decryptedData = await aesDecrypt(encryptedData, encodingAesKey);
        } catch (error) {
          this.logger.error('Failed to decrypt event data', error);
          throw new WebhookDecryptionException(
            'TENCENT_MEETING',
            `Failed to decrypt event data: ${error.message}`,
          );
        }

        // Parse JSON
        let eventData: TencentMeetingEvent;
        try {
          eventData = JSON.parse(decryptedData);
        } catch (error) {
          this.logger.error('Failed to parse decrypted JSON data', {
            decryptedData: decryptedData.substring(0, 200) + '...',
          });
          throw new WebhookDecryptionException(
            'TENCENT_MEETING',
            'Failed to parse decrypted data as JSON',
          );
        }

        this.logger.log(
          `Successfully processed Tencent Meeting event: ${eventData.event}`,
          {
            event: eventData.event,
            traceId: eventData.trace_id,
            payloadCount: eventData.payload?.length || 0,
          },
        );

        // Handle decrypted event data asynchronously
        // 不等待处理完成，避免超时导致腾讯会议重试
        this.tencentEventHandlerService
          .handleEvent(eventData)
          .catch((error) => {
            this.logger.error('Failed to handle event asynchronously', error);
          });

        // 必须返回这个确切字符串，不能有任何变化
        return 'successfully received callback';
      }

      this.logger.warn('Invalid webhook request - no data field found');
      throw new BadRequestException(
        'Invalid Webhook request - missing data field',
      );
    } catch (error) {
      this.logger.error('Failed to handle Tencent Meeting Webhook', {
        error: error.message,
        stack: error.stack,
        body: body ? JSON.stringify(body).substring(0, 500) + '...' : 'no body',
      });

      // 确保所有错误都抛出，让腾讯会议能够重试
      throw error;
    }
  }
}
