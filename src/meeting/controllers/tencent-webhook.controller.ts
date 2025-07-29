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
import { TencentWebhookHandler } from '../services/platforms/tencent/tencent-webhook.service';
import { TencentConfigService } from '../services/platforms/tencent/tencent-config.service';
import { TencentWebhookHeadersDto } from '../dto/webhooks/tencent-webhook.dto';
import { WebhookLoggingInterceptor } from '../interceptors/webhook-logging.interceptor';
import { TencentWebhookDecorators, applyDecorators } from '../../common/decorators/api-decorators';
import { verifySignature, aesDecrypt } from '../services/platforms/tencent/tencent-crypto.service';
import { TencentMeetingEvent } from '../types/tencent.types';
import {
    WebhookSignatureVerificationException,
    WebhookDecryptionException
} from '../exceptions/webhook.exceptions';

/**
 * 腾讯会议Webhook控制器
 * 专门处理腾讯会议的Webhook请求
 */
@ApiTags('Webhooks')
@Controller('webhooks/tencent')
@UseInterceptors(WebhookLoggingInterceptor)
export class TencentWebhookController {
    private readonly logger = new Logger(TencentWebhookController.name);

    constructor(
        private readonly tencentWebhookHandler: TencentWebhookHandler,
        private readonly configService: TencentConfigService
    ) { }

    /**
     * 腾讯会议Webhook URL验证端点 (GET)
     * 用于腾讯会议webhook URL有效性验证
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
        this.logger.log('收到腾讯会议Webhook URL验证请求');

        try {
            return await this.tencentWebhookHandler.verifyWebhookUrl(
                checkStr,
                timestamp,
                nonce,
                signature
            );
        } catch (error) {
            this.logger.error('处理腾讯会议Webhook URL验证失败', error.stack);
            throw error;
        }
    }

    /**
     * 腾讯会议Webhook事件接收端点 (POST)
     * 支持事件接收
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
        this.logger.log('收到腾讯会议Webhook请求');
        try {
            // URL验证请求
            if (echostr && msgSignature && timestamp && nonce) {
                this.logger.log('处理腾讯会议URL验证请求');
                return await this.tencentWebhookHandler.verifyWebhookUrl(
                    echostr,
                    timestamp,
                    nonce,
                    msgSignature
                );
            }

            // 事件通知请求
            if (body && typeof body === 'object') {
                this.logger.log('处理腾讯会议事件通知');

                // 从请求头获取签名信息
                const signature = headers['wechatwork-signature'] || headers['Wechatwork-Signature'];
                const eventTimestamp = headers['wechatwork-timestamp'] || headers['Wechatwork-Timestamp'];
                const eventNonce = headers['wechatwork-nonce'] || headers['Wechatwork-Nonce'];

                if (!signature || !eventTimestamp || !eventNonce) {
                    throw new BadRequestException('缺少必要的签名头部信息');
                }

                // 处理加密的事件数据
                const encryptedData = typeof body === 'string' ? body : JSON.stringify(body);

                // 验证签名
                const token = this.configService.getToken();
                const isValid = verifySignature(token, eventTimestamp, eventNonce, encryptedData, signature);

                if (!isValid) {
                    throw new WebhookSignatureVerificationException('TENCENT_MEETING');
                }

                // 解密数据
                const encodingAesKey = this.configService.getEncodingAesKey();
                const decryptedData = await aesDecrypt(encryptedData, encodingAesKey);

                // 解析JSON
                let eventData: TencentMeetingEvent;
                try {
                    eventData = JSON.parse(decryptedData);
                } catch (error) {
                    throw new WebhookDecryptionException(
                        'TENCENT_MEETING',
                        'Failed to parse decrypted data as JSON'
                    );
                }

                this.logger.log(`成功解密腾讯会议事件: ${eventData.event}`);

                // 处理已解密的事件数据
                await this.tencentWebhookHandler.handleDecryptedEvent(eventData);

                return;
            }

            throw new BadRequestException('无效的Webhook请求');

        } catch (error) {
            this.logger.error('处理腾讯会议Webhook失败', error.stack);
            throw error;
        }
    }
}