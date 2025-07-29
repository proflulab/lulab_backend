/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-28 14:01:40
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-29 19:53:07
 * @FilePath: /lulab_backend/src/meeting/controllers/webhook.controller.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import {
    Controller,
    Post,
    HttpCode,
    HttpStatus,
    Logger,
    UseInterceptors
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { WebhookLoggingInterceptor } from '../interceptors/webhook-logging.interceptor';
import { CommonWebhookDecorators, applyDecorators } from '../../common/decorators/api-decorators';

/**
 * 通用Webhook控制器
 * 提供Webhook相关的通用功能和统计信息
 */
@ApiTags('Webhooks')
@Controller('webhooks')
@UseInterceptors(WebhookLoggingInterceptor)
export class WebhookController {

    constructor(
        private readonly webhookService: WebhookService
    ) { }

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
        platforms: string[];
    } {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            supportedEvents: this.webhookService.getSupportedEvents().length,
            platforms: ['tencent', 'feishu']
        };
    }
}