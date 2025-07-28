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
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { TencentWebhookEventDto, TencentWebhookHeadersDto } from '../dto/webhooks/tencent-webhook.dto';
import { WebhookLoggingInterceptor } from '../interceptors/webhook-logging.interceptor';

/**
 * 统一Webhook控制器
 * 处理各平台的Webhook请求
 * 
 * TODO: 添加Webhook请求频率限制
 * TODO: 实现Webhook事件重试机制
 * TODO: 添加Webhook事件持久化存储
 * TODO: 实现Webhook事件监控和告警
 * TODO: 添加更多平台支持（钉钉、企业微信等）
 */
@ApiTags('Webhooks')
@Controller('webhooks')
@UseInterceptors(WebhookLoggingInterceptor)
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(private readonly webhookService: WebhookService) { }

    /**
     * 腾讯会议Webhook URL验证端点 (GET)
     * 用于腾讯会议webhook URL有效性验证
     */
    @Get('tencent')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '腾讯会议Webhook URL验证',
        description: '用于腾讯会议webhook URL有效性验证'
    })
    @ApiQuery({
        name: 'check_str',
        description: '验证字符串',
        required: true
    })
    @ApiQuery({
        name: 'timestamp',
        description: '时间戳',
        required: true
    })
    @ApiQuery({
        name: 'nonce',
        description: '随机数',
        required: true
    })
    @ApiQuery({
        name: 'signature',
        description: '签名',
        required: true
    })
    @ApiResponse({
        status: 200,
        description: '验证成功，返回解密后的明文'
    })
    @ApiResponse({
        status: 400,
        description: '缺少必要参数'
    })
    @ApiResponse({
        status: 403,
        description: '签名验证失败'
    })
    async verifyTencentWebhook(
        @Query('check_str') checkStr: string,
        @Query('timestamp') timestamp: string,
        @Query('nonce') nonce: string,
        @Query('signature') signature: string
    ): Promise<string> {
        this.logger.log('收到腾讯会议Webhook URL验证请求');

        try {
            return await this.webhookService.handleTencentWebhookVerification(
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
    @ApiOperation({
        summary: '腾讯会议Webhook事件接收',
        description: '接收腾讯会议的Webhook事件通知'
    })
    @ApiHeader({
        name: 'Wechatwork-Signature',
        description: '腾讯会议签名',
        required: true
    })
    @ApiQuery({
        name: 'msg_signature',
        description: '消息签名（URL验证时使用）',
        required: false
    })
    @ApiQuery({
        name: 'timestamp',
        description: '时间戳',
        required: false
    })
    @ApiQuery({
        name: 'nonce',
        description: '随机数',
        required: false
    })
    @ApiQuery({
        name: 'echostr',
        description: '验证字符串（URL验证时使用）',
        required: false
    })
    @ApiResponse({
        status: 200,
        description: 'Webhook处理成功'
    })
    @ApiResponse({
        status: 400,
        description: '请求参数错误'
    })
    @ApiResponse({
        status: 401,
        description: '签名验证失败'
    })
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
                return await this.webhookService.handleTencentWebhookVerification(
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

                // TODO: 添加请求时间戳验证，防止重放攻击
                // TODO: 实现事件去重机制
                // TODO: 添加事件处理状态跟踪
                
                // 处理加密的事件数据
                const encryptedData = typeof body === 'string' ? body : JSON.stringify(body);

                await this.webhookService.handleTencentWebhookEvent(
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
     * Zoom Webhook接收端点（示例）
     * TODO: 实现完整的Zoom Webhook处理逻辑
     * TODO: 添加Zoom特定的签名验证
     * TODO: 实现Zoom会议事件的具体处理
     * TODO: 添加Zoom API集成和录制文件处理
     */
    @Post('zoom')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Zoom Webhook',
        description: '接收Zoom的Webhook事件'
    })
    @ApiResponse({
        status: 200,
        description: 'Webhook处理成功'
    })
    async handleZoomWebhook(
        @Body() body: any,
        @Headers() headers: Record<string, string>
    ): Promise<void> {
        this.logger.log('收到Zoom Webhook请求');

        try {
            // TODO: 实现Zoom Webhook事件处理逻辑
            await this.webhookService.handleZoomWebhookEvent(body, headers);
        } catch (error) {
            this.logger.error('处理Zoom Webhook失败', error.stack);
            throw error;
        }
    }

    /**
     * Microsoft Teams Webhook接收端点（示例）
     * TODO: 实现完整的Microsoft Teams Webhook处理逻辑
     * TODO: 添加Teams特定的身份验证和签名验证
     * TODO: 实现Teams会议事件的具体处理
     * TODO: 添加Microsoft Graph API集成
     * TODO: 实现Teams录制文件和转录处理
     */
    @Post('teams')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Teams Webhook',
        description: '接收Microsoft Teams的Webhook事件'
    })
    @ApiResponse({
        status: 200,
        description: 'Webhook处理成功'
    })
    async handleTeamsWebhook(
        @Body() body: any,
        @Headers() headers: Record<string, string>
    ): Promise<void> {
        this.logger.log('收到Teams Webhook请求');

        try {
            // TODO: 实现Teams Webhook事件处理逻辑
            await this.webhookService.handleTeamsWebhookEvent(body, headers);
        } catch (error) {
            this.logger.error('处理Teams Webhook失败', error.stack);
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
    @ApiOperation({
        summary: '获取支持的事件',
        description: '获取当前支持的所有Webhook事件类型'
    })
    @ApiResponse({
        status: 200,
        description: '支持的事件列表',
        schema: {
            type: 'object',
            properties: {
                events: {
                    type: 'array',
                    items: { type: 'string' }
                },
                stats: {
                    type: 'object',
                    properties: {
                        totalHandlers: { type: 'number' },
                        supportedPlatforms: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        supportedEvents: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                }
            }
        }
    })
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
    @ApiOperation({
        summary: 'Webhook健康检查',
        description: '检查Webhook服务的健康状态'
    })
    @ApiResponse({
        status: 200,
        description: '服务健康',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string' },
                timestamp: { type: 'string' },
                supportedEvents: { type: 'number' }
            }
        }
    })
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