/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-29 18:38:47
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-09-03 02:44:23
 * @FilePath: /lulab_backend/src/tencent_meeting/services/tencent/handlers/event-handler-factory.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { Injectable, Logger } from '@nestjs/common';
import { BaseTencentEventHandler } from './base-event-handler';
import { RecordingCompletedHandler } from './recording-completed-handler';
import { MeetingStartedHandler } from './meeting-started-handler';
import { UnsupportedWebhookEventException } from '../../exceptions/webhook.exceptions';
import { TencentMeetingEvent } from '../../types/tencent.types';

/**
 * 腾讯会议事件处理器工厂
 * 负责管理和分发不同类型的事件处理器，以及处理腾讯会议事件
 */
@Injectable()
export class TencentEventHandlerFactory {
    private readonly logger = new Logger(TencentEventHandlerFactory.name);
    private readonly handlers = new Map<string, BaseTencentEventHandler>();
    private readonly PLATFORM_NAME = 'TENCENT_MEETING';

    constructor(
        private readonly recordingCompletedHandler: RecordingCompletedHandler,
        private readonly meetingStartedHandler: MeetingStartedHandler,
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
        ];

        for (const handler of handlers) {
            const eventType = handler.getSupportedEventType();
            this.handlers.set(eventType, handler);
            this.logger.log(`注册事件处理器: ${eventType}`);
        }

        this.logger.log(`腾讯会议事件处理器工厂初始化完成，共注册 ${this.handlers.size} 个处理器`);
    }

    /**
     * 处理已解密的腾讯会议事件数据
     * @param eventData 已解密的事件数据
     */
    async handleDecryptedEvent(eventData: TencentMeetingEvent): Promise<void> {
        this.logger.log('处理腾讯会议Webhook事件');

        try {
            // 获取对应的事件处理器
            const handler = this.handlers.get(eventData.event);

            if (!handler) {
                throw new UnsupportedWebhookEventException(this.PLATFORM_NAME, eventData.event);
            }

            // 处理事件
            await handler.handleEvent(eventData);

            this.logger.log(`腾讯会议事件处理完成: ${eventData.event}`);

        } catch (error) {
            this.logger.error('处理腾讯会议Webhook事件失败', error.stack);
            throw error;
        }
    }
}