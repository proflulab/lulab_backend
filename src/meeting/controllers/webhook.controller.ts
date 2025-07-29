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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { TencentWebhookHandler } from '../services/platforms/tencent/tencent-webhook.service';
import { TencentWebhookHeadersDto } from '../dto/webhooks/tencent-webhook.dto';
import { WebhookLoggingInterceptor } from '../interceptors/webhook-logging.interceptor';
import { TencentWebhookDecorators, CommonWebhookDecorators, applyDecorators } from '../../common/decorators/api-decorators';

/**
 * 统一Webhook控制器
 * 处理各平台的Webhook请求
 *
 */
@ApiTags('Webhooks')
@Controller('webhooks')
@UseInterceptors(WebhookLoggingInterceptor)
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(
        private readonly webhookService: WebhookService,
        private readonly tencentWebhookHandler: TencentWebhookHandler
    ) { }

    /**
     * 腾讯会议Webhook URL验证端点 (GET)
     * 用于腾讯会议webhook URL有效性验证
     */
    @Get('tencent')
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
    @Post('tencent')
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

                await this.tencentWebhookHandler.handleWebhookEvent(
                    encryptedData,
                    eventTimestamp,
                    eventNonce,
                    signature
                );

                return;
            }

            throw new BadRequestException('无效的Webhook请求');

        } catch (error) {
            this.logger.error('处理腾讯会议Webhook失败', error.stack);
            throw error;
        }
    }

    /**
     * 飞书Webhook接收端点（示例）
     * TODO: 实现完整的飞书Webhook处理逻辑
     * TODO: 添加飞书特定的签名验证机制
     * TODO: 实现飞书会议事件的具体处理
     * TODO: 添加飞书开放平台API集成
     * TODO: 实现飞书录制文件和会议纪要处理
     */
    @Post('feishu')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '飞书Webhook',
        description: '接收飞书的Webhook事件'
    })
    @ApiResponse({
        status: 200,
        description: 'Webhook处理成功'
    })
    async handleFeishuWebhook(
        @Body() body: any,
        @Headers() headers: Record<string, string>
    ): Promise<void> {
        this.logger.log('收到飞书Webhook请求');

        try {
            // TODO: 实现飞书Webhook事件处理逻辑
            await this.webhookService.handleFeishuWebhookEvent(body, headers);
        } catch (error) {
            this.logger.error('处理飞书Webhook失败', error.stack);
            throw error;
        }
    }

    /**
     * 获取支持的Webhook事件列表
     */
    @Post('events/supported')
    @HttpCode(HttpStatus.OK)
    @applyDecorators(CommonWebhookDecorators.supportedEvents)
    getSupportedEvents(): {
        events: string[];
        stats: {
            totalHandlers: number;
            supportedPlatforms: string[];
            supportedEvents: string[];
        };
    } {
        return {
            events: this.webhookService.getSupportedEvents(),
            stats: this.webhookService.getEventStats()
        };
    }

    /**
     * 健康检查端点
     */
    @Post('health')
    @HttpCode(HttpStatus.OK)
    @applyDecorators(CommonWebhookDecorators.healthCheck)
    healthCheck(): {
        status: string;
        timestamp: string;
        supportedEvents: number;
    } {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            supportedEvents: this.webhookService.getSupportedEvents().length
        };
    }
}