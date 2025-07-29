import { Injectable, Logger } from '@nestjs/common';
import { MeetingPlatform } from '@prisma/client';
import { PlatformEventData } from '../types/meeting.types';
import {
    UnsupportedWebhookEventException,
    WebhookProcessingTimeoutException
} from '../exceptions/webhook.exceptions';
import { FeishuWebhookHandler } from './platforms/feishu/feishu-webhook.service';

/**
 * 统一Webhook处理服务
 * 负责分发各平台的Webhook事件到对应的处理器
 */
@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);
    private readonly eventHandlers: Map<string, Function> = new Map();

    constructor(
        private readonly feishuWebhookHandler: FeishuWebhookHandler
    ) {
        this.initializeEventHandlers();
    }

    /**
     * 初始化事件处理器映射
     */
    private initializeEventHandlers(): void {
        // 可以在这里添加各平台的事件处理器
        // this.eventHandlers.set('tencent.recording.completed', this.handleTencentRecordingCompleted.bind(this));
        // this.eventHandlers.set('zoom.recording.completed', this.handleZoomRecordingCompleted.bind(this));
        // this.eventHandlers.set('teams.recording.completed', this.handleTeamsRecordingCompleted.bind(this));
    }

    /**
     * 通用事件分发器
     */
    async dispatchEvent(eventData: PlatformEventData): Promise<void> {
        const eventKey = `${eventData.platform.toLowerCase()}.${eventData.event}`;
        const handler = this.eventHandlers.get(eventKey);

        if (!handler) {
            throw new UnsupportedWebhookEventException(
                eventData.platform,
                eventData.event
            );
        }

        this.logger.log(`分发事件: ${eventKey}`);

        try {
            // 设置超时处理
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new WebhookProcessingTimeoutException(
                        eventData.platform,
                        eventData.event,
                        30000 // 30秒超时
                    ));
                }, 30000);
            });

            // 执行事件处理
            await Promise.race([
                handler(eventData.payload),
                timeoutPromise
            ]);

            this.logger.log(`事件处理完成: ${eventKey}`);
        } catch (error) {
            this.logger.error(`事件处理失败: ${eventKey}`, error.stack);
            throw error;
        }
    }

    /**
     * 注册新的事件处理器
     */
    registerEventHandler(eventKey: string, handler: Function): void {
        this.eventHandlers.set(eventKey, handler);
        this.logger.log(`注册事件处理器: ${eventKey}`);
    }

    /**
     * 获取支持的事件列表
     */
    getSupportedEvents(): string[] {
        return Array.from(this.eventHandlers.keys());
    }

    /**
     * 检查事件是否支持
     */
    isEventSupported(platform: MeetingPlatform, event: string): boolean {
        const eventKey = `${platform.toLowerCase()}.${event}`;
        return this.eventHandlers.has(eventKey);
    }

    /**
     * 获取事件处理统计信息
     */
    getEventStats(): {
        totalHandlers: number;
        supportedPlatforms: string[];
        supportedEvents: string[];
    } {
        const platforms = new Set<string>();
        const events = new Set<string>();

        for (const eventKey of this.eventHandlers.keys()) {
            const [platform, event] = eventKey.split('.');
            platforms.add(platform);
            events.add(event);
        }

        return {
            totalHandlers: this.eventHandlers.size,
            supportedPlatforms: Array.from(platforms),
            supportedEvents: Array.from(events)
        };
    }

    /**
     * 处理飞书Webhook事件
     */
    async handleFeishuWebhookEvent(
        payload: any,
        headers: Record<string, string>
    ): Promise<void> {
        return this.feishuWebhookHandler.handleWebhookEvent(payload, headers);
    }
}