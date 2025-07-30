/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-29 18:38:05
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-30 16:17:15
 * @FilePath: /lulab_backend/src/meeting/services/platforms/tencent/handlers/base-event-handler.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by 杨仕明, All Rights Reserved. 
 */

import { Logger } from '@nestjs/common';
import { TencentMeetingEvent } from '../types/tencent.types';

/**
 * 腾讯会议事件处理器基类
 * 定义事件处理器的通用接口和行为
 */
export abstract class BaseTencentEventHandler {
    protected readonly logger = new Logger(this.constructor.name);

    /**
     * 获取处理器支持的事件类型
     */
    abstract getSupportedEventType(): string;

    /**
     * 处理事件
     * @param eventData 事件数据
     */
    abstract handleEvent(eventData: TencentMeetingEvent): Promise<void>;

    /**
     * 检查是否可以处理指定事件类型
     * @param eventType 事件类型
     */
    canHandle(eventType: string): boolean {
        return this.getSupportedEventType() === eventType;
    }

    /**
     * 记录事件处理开始
     * @param eventData 事件数据
     */
    protected logEventStart(eventData: TencentMeetingEvent): void {
        this.logger.log(`开始处理腾讯会议事件: ${eventData.event}`);
    }

    /**
     * 记录事件处理完成
     * @param eventData 事件数据
     */
    protected logEventComplete(eventData: TencentMeetingEvent): void {
        this.logger.log(`腾讯会议事件处理完成: ${eventData.event}`);
    }

    /**
     * 记录事件处理失败
     * @param eventData 事件数据
     * @param error 错误信息
     */
    protected logEventError(eventData: TencentMeetingEvent, error: any): void {
        this.logger.error(`腾讯会议事件处理失败: ${eventData.event}`, error);
    }

    /**
     * 记录事件接收详情
     * @param eventData 事件数据
     */
    protected logEventReceived(eventData: TencentMeetingEvent): void {
        const eventSummary = {
            event: eventData.event,
            payloadCount: eventData.payload.length,
            timestamp: new Date().toISOString()
        };

        this.logger.log('事件接收详情:', eventSummary);
    }

    /**
     * 处理单个载荷的具体逻辑（由子类实现）
     * @param payload 单个事件载荷
     * @param index 载荷索引
     */
    protected abstract handlePayload(payload: any, index: number): Promise<void>;
}