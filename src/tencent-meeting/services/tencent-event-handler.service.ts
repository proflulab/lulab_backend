import { Injectable, Logger } from '@nestjs/common';
import { TencentMeetingEvent } from '../types/tencent-webhook-events.types';
import { UnsupportedWebhookEventException } from '../exceptions/webhook.exceptions';
import { EventHandlerFactory } from './event-handlers/event-handler.factory';

/**
 * 腾讯会议事件处理器 - 使用工厂模式
 * 将不同事件的处理逻辑分离到不同的处理器中
 */
@Injectable()
export class TencentEventHandlerService {
  private readonly logger = new Logger(TencentEventHandlerService.name);
  private readonly PLATFORM_NAME = 'TENCENT_MEETING';

  constructor(private readonly eventHandlerFactory: EventHandlerFactory) {}

  /**
   * 处理腾讯会议事件
   */
  async handleEvent(eventData: TencentMeetingEvent): Promise<void> {
    const { event, payload } = eventData;

    this.logger.log(`开始处理腾讯会议事件: ${event}`);
    this.logEventDetails(eventData);

    const handler = this.eventHandlerFactory.getHandler(event);
    if (!handler) {
      throw new UnsupportedWebhookEventException(this.PLATFORM_NAME, event);
    }

    try {
      // 批量处理payload
      for (let i = 0; i < payload.length; i++) {
        await handler.handle(payload[i], i);
      }

      this.logger.log(`腾讯会议事件处理完成: ${event}`);
    } catch (error) {
      this.logger.error(`腾讯会议事件处理失败: ${event}`, error);
      throw error;
    }
  }

  /**
   * 记录事件详情
   */
  private logEventDetails(eventData: TencentMeetingEvent): void {
    this.logger.log('事件接收详情:', {
      event: eventData.event,
      traceId: eventData.trace_id,
      payloadCount: eventData.payload.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 获取支持的事件类型
   */
  getSupportedEvents(): string[] {
    return this.eventHandlerFactory.getSupportedEvents();
  }
}
