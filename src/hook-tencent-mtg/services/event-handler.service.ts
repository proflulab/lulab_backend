/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-20 22:01:42
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-23 01:39:22
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/event-handler.service.ts
 * @Description: Tencent Meeting event handler service
 * 
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved. 
 */

import { Injectable, Logger } from '@nestjs/common';
import { TencentMeetingEvent } from '../types';
import { UnsupportedWebhookEventException } from '../../integrations/tencent-meeting';
import { EventHandlerFactory } from '../handlers/event-handler.factory';

/**
 * Tencent Meeting event handler service
 * - using factory pattern  
 * Separates handling logic for different events into different handlers
 */
@Injectable()
export class TencentEventHandlerService {
  private readonly logger = new Logger(TencentEventHandlerService.name);
  private readonly PLATFORM_NAME = 'TENCENT_MEETING';

  constructor(private readonly eventHandlerFactory: EventHandlerFactory) {}

  /**
   * Handle Tencent Meeting events
   */
  async handleEvent(eventData: TencentMeetingEvent): Promise<void> {
    const { event, payload } = eventData;
    
    this.logEventDetails(eventData);

    const handler = this.eventHandlerFactory.getHandler(event);
    if (!handler) {
      throw new UnsupportedWebhookEventException(this.PLATFORM_NAME, event);
    }

    try {
      // Batch process payloads
      for (let i = 0; i < payload.length; i++) {
        await handler.handle(payload[i], i);
      }

      this.logger.log(`Tencent Meeting event processing completed: ${event}`);
    } catch (error) {
      this.logger.error(`Tencent Meeting event processing failed: ${event}`, error);
      throw error;
    }
  }

  /**
   * Log event details
   */
  private logEventDetails(eventData: TencentMeetingEvent): void {
    this.logger.log('Event received details:', {
      event: eventData.event,
      traceId: eventData.trace_id,
      payloadCount: eventData.payload.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get supported event types
   */
  getSupportedEvents(): string[] {
    return this.eventHandlerFactory.getSupportedEvents();
  }
}
