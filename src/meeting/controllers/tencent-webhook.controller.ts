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
    UseInterceptors
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TencentEventValidator } from '../services/platforms/tencent/tencent-event-validator.service';
import { TencentConfigService } from '../services/platforms/tencent/tencent-config.service';
import { TencentWebhookHeadersDto } from '../dto/webhooks/tencent-webhook.dto';
import { WebhookLoggingInterceptor } from '../interceptors/webhook-logging.interceptor';
import { TencentWebhookDecorators, applyDecorators } from '../../common/decorators/api-decorators';
import { verifySignature, aesDecrypt, verifyWebhookUrl } from '../services/platforms/tencent/tencent-crypto.service';
import { TencentMeetingEvent } from '../types/tencent.types';
import {
    WebhookSignatureVerificationException,
    WebhookDecryptionException
} from '../exceptions/webhook.exceptions';

/**
 * Tencent Meeting Webhook Controller
 * Specifically handles Tencent Meeting webhook requests
 */
@ApiTags('Webhooks')
@Controller('webhooks/tencent')
@UseInterceptors(WebhookLoggingInterceptor)
export class TencentWebhookController {
    private readonly logger = new Logger(TencentWebhookController.name);

    constructor(
        private readonly tencentEventValidator: TencentEventValidator,
        private readonly configService: TencentConfigService
    ) { }

    /**
     * Tencent Meeting Webhook URL verification endpoint (GET)
     * Used for Tencent Meeting webhook URL validity verification
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @applyDecorators(TencentWebhookDecorators.urlVerification)
    async verifyTencentWebhook(
        @Query('check_str') checkStr: string,
        @Query('timestamp') timestamp: string,
        @Query('nonce') nonce: string,
        @Query('signature') signature: string
    ): Promise<string> {
        this.logger.log('Received Tencent Meeting Webhook URL verification request');

        try {
            const token = this.configService.getToken();
            const encodingAesKey = this.configService.getEncodingAesKey();
            return await verifyWebhookUrl(
                checkStr,
                timestamp,
                nonce,
                signature,
                token,
                encodingAesKey
            );
        } catch (error) {
            this.logger.error('Failed to handle Tencent Meeting Webhook URL verification', error.stack);
            throw error;
        }
    }

    /**
     * Tencent Meeting Webhook event receiving endpoint (POST)
     * Supports event reception
     */
    @Post()
    @HttpCode(HttpStatus.OK)
    @applyDecorators(TencentWebhookDecorators.eventReceiver)
    async handleTencentWebhook(
        @Body() body: any,
        @Headers() headers: TencentWebhookHeadersDto,
        @Query('msg_signature') msgSignature?: string,
        @Query('timestamp') timestamp?: string,
        @Query('nonce') nonce?: string,
        @Query('echostr') echostr?: string
    ): Promise<string | void> {
        this.logger.log('Received Tencent Meeting Webhook request');
        try {
            // URL verification request
            if (echostr && msgSignature && timestamp && nonce) {
                this.logger.log('Handling Tencent Meeting URL verification request');
                const token = this.configService.getToken();
                const encodingAesKey = this.configService.getEncodingAesKey();
                return await verifyWebhookUrl(
                    echostr,
                    timestamp,
                    nonce,
                    msgSignature,
                    token,
                    encodingAesKey
                );
            }

            // Event notification request
            if (body && typeof body === 'object') {
                this.logger.log('Handling Tencent Meeting event notification');

                // Get signature information from request headers
                const signature = headers['wechatwork-signature'] || headers['Wechatwork-Signature'];
                const eventTimestamp = headers['wechatwork-timestamp'] || headers['Wechatwork-Timestamp'];
                const eventNonce = headers['wechatwork-nonce'] || headers['Wechatwork-Nonce'];

                if (!signature || !eventTimestamp || !eventNonce) {
                    throw new BadRequestException('Missing required signature header information');
                }

                // Process encrypted event data
                const encryptedData = typeof body === 'string' ? body : JSON.stringify(body);

                // Verify signature
                const token = this.configService.getToken();
                const isValid = verifySignature(token, eventTimestamp, eventNonce, encryptedData, signature);

                if (!isValid) {
                    throw new WebhookSignatureVerificationException('TENCENT_MEETING');
                }

                // Decrypt data
                const encodingAesKey = this.configService.getEncodingAesKey();
                const decryptedData = await aesDecrypt(encryptedData, encodingAesKey);

                // Parse JSON
                let eventData: TencentMeetingEvent;
                try {
                    eventData = JSON.parse(decryptedData);
                } catch (error) {
                    throw new WebhookDecryptionException(
                        'TENCENT_MEETING',
                        'Failed to parse decrypted data as JSON'
                    );
                }

                this.logger.log(`Successfully decrypted Tencent Meeting event: ${eventData.event}`);

                // Handle decrypted event data
                await this.tencentEventValidator.handleDecryptedEvent(eventData);

                return;
            }

            throw new BadRequestException('Invalid Webhook request');

        } catch (error) {
            this.logger.error('Failed to handle Tencent Meeting Webhook', error.stack);
            throw error;
        }
    }
}