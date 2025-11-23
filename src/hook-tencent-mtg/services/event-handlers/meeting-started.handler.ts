/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-24 01:14:33
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-24 02:19:02
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/event-handlers/meeting-started.handler.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import {
  TencentEventPayload,
  TencentMeetingUser,
} from '../../types/tencent-webhook-events.types';
import { TencentMeetingQueueService } from '../tencent-meeting-queue.service';
import { Injectable, Logger } from '@nestjs/common';
import { BaseEventHandler } from './base-event.handler';

/**
 * 会议开始事件处理器
 */
@Injectable()
export class MeetingStartedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'meeting.started';
  protected readonly logger = new Logger(MeetingStartedHandler.name);

  constructor(private readonly queueService: TencentMeetingQueueService) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    const { meeting_info, operator } = payload;
    const { creator } = meeting_info;

    this.logger.log(
      `会议开始 [${index}]: ${meeting_info.subject} (${meeting_info.meeting_code}) `,
    );

    // 2. 并发处理用户入队 (操作者 & 创建者)
    // 使用 Promise.allSettled 确保一个失败不影响另一个
    const userUpsertPromises: Promise<void>[] = [];

    if (operator?.uuid) {
      userUpsertPromises.push(this.enqueueUser(operator, '操作者'));
    }

    if (creator?.uuid) {
      // 这里的 creator 逻辑和 operator 是一样的，去重处理
      // 注意：如果 creator 和 operator 是同一个人，这里会重复入队，
      // 可以在这里做个去重判断，或者交给 QueueService 去重
      if (creator.uuid !== operator?.uuid) {
        userUpsertPromises.push(this.enqueueUser(creator, '创建者'));
      }
    }

    // 不阻塞主流程，等待入队结果（或者你可以选择不 await，直接由于后台执行，取决于业务对一致性的要求）
    await Promise.allSettled(userUpsertPromises);
  }

  /**
   * 封装用户入队逻辑，减少重复代码
   */
  private async enqueueUser(
    user: TencentMeetingUser,
    roleLabel: string,
  ): Promise<void> {
    try {
      await this.queueService.enqueueUpsertMeetingUser({
        uuid: user.uuid,
        userid: user.userid,
        user_name: user.user_name,
        is_enterprise_user: !!user.userid,
      });
      this.logger.log(
        `已入队处理${roleLabel}信息: ${user.user_name} (${user.uuid})`,
      );
    } catch (error) {
      this.logger.error(`入队处理${roleLabel}信息失败: ${user.uuid}`, error);
      // 这里可以选择 throw error 让 Promise.allSettled 捕获，或者仅记录日志
    }
  }
}
