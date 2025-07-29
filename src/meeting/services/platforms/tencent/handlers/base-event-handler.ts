import { Logger } from '@nestjs/common';
import { TencentMeetingEvent } from '../../../../types/tencent.types';

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
     * 处理单个payload的通用逻辑
     * @param payload 单个事件载荷
     * @param index 载荷索引
     */
    protected async processPayload(payload: any, index: number): Promise<void> {
        try {
            this.logger.log(`处理第 ${index + 1} 个载荷`);
            await this.handlePayload(payload, index);
            this.logger.log(`第 ${index + 1} 个载荷处理完成`);
        } catch (error) {
            this.logger.error(`第 ${index + 1} 个载荷处理失败`, error);
            // 继续处理其他载荷，不中断整个流程
        }
    }

    /**
     * 处理单个载荷的具体逻辑（由子类实现）
     * @param payload 单个事件载荷
     * @param index 载荷索引
     */
    protected abstract handlePayload(payload: any, index: number): Promise<void>;
}