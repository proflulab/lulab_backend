import { Injectable, Logger } from '@nestjs/common';
import { BaseTencentEventHandler } from './base-event-handler';
import { RecordingCompletedHandler } from './recording-completed-handler';
import { MeetingStartedHandler } from './meeting-started-handler';
import { MeetingEndedHandler } from './meeting-ended-handler';
import { ParticipantJoinedHandler } from './participant-joined-handler';
import { ParticipantLeftHandler } from './participant-left-handler';
import { UnsupportedWebhookEventException } from '../../../../exceptions/webhook.exceptions';

/**
 * 腾讯会议事件处理器工厂
 * 负责管理和分发不同类型的事件处理器
 */
@Injectable()
export class TencentEventHandlerFactory {
    private readonly logger = new Logger(TencentEventHandlerFactory.name);
    private readonly handlers = new Map<string, BaseTencentEventHandler>();
    private readonly PLATFORM_NAME = 'TENCENT_MEETING';

    constructor(
        private readonly recordingCompletedHandler: RecordingCompletedHandler,
        private readonly meetingStartedHandler: MeetingStartedHandler,
        private readonly meetingEndedHandler: MeetingEndedHandler,
        private readonly participantJoinedHandler: ParticipantJoinedHandler,
        private readonly participantLeftHandler: ParticipantLeftHandler,
    ) {
        this.initializeHandlers();
    }

    /**
     * 初始化事件处理器
     */
    private initializeHandlers(): void {
        const handlers = [
            this.recordingCompletedHandler,
            this.meetingStartedHandler,
            this.meetingEndedHandler,
            this.participantJoinedHandler,
            this.participantLeftHandler
        ];

        for (const handler of handlers) {
            const eventType = handler.getSupportedEventType();
            this.handlers.set(eventType, handler);
            this.logger.log(`注册事件处理器: ${eventType}`);
        }

        this.logger.log(`腾讯会议事件处理器工厂初始化完成，共注册 ${this.handlers.size} 个处理器`);
    }

    /**
     * 获取事件处理器
     * @param eventType 事件类型
     * @returns 事件处理器
     */
    getHandler(eventType: string): BaseTencentEventHandler {
        const handler = this.handlers.get(eventType);

        if (!handler) {
            throw new UnsupportedWebhookEventException(this.PLATFORM_NAME, eventType);
        }

        return handler;
    }

    /**
     * 检查事件类型是否支持
     * @param eventType 事件类型
     * @returns 是否支持
     */
    isEventSupported(eventType: string): boolean {
        return this.handlers.has(eventType);
    }

    /**
     * 获取所有支持的事件类型
     * @returns 支持的事件类型列表
     */
    getSupportedEventTypes(): string[] {
        return Array.from(this.handlers.keys());
    }

    /**
     * 注册新的事件处理器
     * @param handler 事件处理器
     */
    registerHandler(handler: BaseTencentEventHandler): void {
        const eventType = handler.getSupportedEventType();

        if (this.handlers.has(eventType)) {
            this.logger.warn(`事件处理器已存在，将被覆盖: ${eventType}`);
        }

        this.handlers.set(eventType, handler);
        this.logger.log(`注册事件处理器: ${eventType}`);
    }

    /**
     * 注销事件处理器
     * @param eventType 事件类型
     */
    unregisterHandler(eventType: string): void {
        if (this.handlers.delete(eventType)) {
            this.logger.log(`注销事件处理器: ${eventType}`);
        } else {
            this.logger.warn(`尝试注销不存在的事件处理器: ${eventType}`);
        }
    }

    /**
     * 获取处理器统计信息
     * @returns 统计信息
     */
    getHandlerStats(): {
        totalHandlers: number;
        supportedEvents: string[];
    } {
        return {
            totalHandlers: this.handlers.size,
            supportedEvents: this.getSupportedEventTypes()
        };
    }
}