/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-22 23:39:35
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-24 00:20:51
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/event-handlers/base-event.handler.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Logger } from '@nestjs/common';

/**
 * 事件处理器接口
 */
export interface IEventHandler {
  handle(payload: any, index: number): Promise<void>;
  supports(event: string): boolean;
}

/**
 * 基础事件处理器
 */
export abstract class BaseEventHandler implements IEventHandler {
  protected readonly logger = new Logger(this.constructor.name);

  abstract handle(payload: any, index: number): Promise<void>;
  abstract supports(event: string): boolean;

  /**
   * 记录事件处理详情
   */
  protected logEventProcessing(
    eventName: string,
    payload: any,
    index: number,
  ): void {
    this.logger.log(`处理 ${eventName} 事件 [${index}]`, {
      event: eventName,
      index,
      timestamp: new Date().toISOString(),
    });
  }
}
