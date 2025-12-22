/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-14 10:55:55
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-23 01:26:18
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/event-handlers/base-event.handler.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Logger } from '@nestjs/common';
import { TencentEventPayload } from '../types/tencent-event.types';

/**
 * Event handler interface
 */
export interface IEventHandler {
  handle(payload: TencentEventPayload, index: number): Promise<void>;
  supports(event: string): boolean;
}

/**
 * Base event handler
 */
export abstract class BaseEventHandler implements IEventHandler {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly PLATFORM_NAME = 'TENCENT_MEETING';

  abstract handle(payload: TencentEventPayload, index: number): Promise<void>;
  abstract supports(event: string): boolean;

  /**
   * Log event processing details
   */
  protected logEventProcessing(
    eventName: string,
    payload: TencentEventPayload,
    index: number,
  ): void {
    this.logger.log(`Processing ${eventName} event [${index}]`, {
      event: eventName,
      index,
      meetingId: payload.meeting_info.meeting_id,
      operatorId: payload.operator.userid,
      operateTime: new Date(payload.operate_time).toISOString(),
      timestamp: new Date().toISOString(),
    });
  }
}
