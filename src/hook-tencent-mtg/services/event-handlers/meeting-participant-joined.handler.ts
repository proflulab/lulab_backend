/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-26 20:41:44
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-30 06:05:16
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/event-handlers/meeting-participant-joined.handler.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from './base-event.handler';
import { TencentEventPayload } from '../../types/tencent-webhook-events.types';
import { MeetingBitableRepository } from '@/integrations/lark/repositories';
import { TencentMeetingQueueService } from '../tencent-meeting-queue.service';

/**
 * 用户入会事件处理器
 * 处理 meeting.participant-joined 事件
 */
@Injectable()
export class MeetingParticipantJoinedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'meeting.participant-joined';

  constructor(
    private readonly meetingBitable: MeetingBitableRepository,
    private readonly queueService: TencentMeetingQueueService,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    const { meeting_info, operator } = payload;

    // 验证必要字段
    if (!meeting_info) {
      this.logger.error(`Invalid payload: missing meeting_info`);
      throw new Error('Invalid payload: missing meeting_info');
    }
    if (!operator) {
      this.logger.error(`Invalid payload: missing operator`);
      throw new Error('Invalid payload: missing operator');
    }

    // 记录用户入会信息
    this.logger.log(
      `用户入会 [${index}]: ${operator.user_name} (${operator.uuid}) 加入会议 ${meeting_info.subject} (${meeting_info.meeting_code})`,
    );

    // 创建或更新入会用户信息
    try {
      await this.queueService.enqueueUpsertMeetingUser({
        uuid: operator.uuid,
        userid: operator.userid,
        user_name: operator.user_name,
        is_enterprise_user: !!operator.userid, // 如果userid不为空则为true，否则为false
      });
      this.logger.log(
        `已入队处理参会人员信息: ${operator.user_name} (${operator.uuid})`,
      );
    } catch (error) {
      this.logger.error(`入队处理参会人员信息失败: ${operator.uuid}`, error);
      // 不抛出错误，避免影响主流程
    }

    // 创建或更新会议记录（使用upsert一步到位）
    try {
      await this.meetingBitable.upsertMeetingRecord({
        platform: '腾讯会议',
        subject: meeting_info.subject,
        meeting_id: meeting_info.meeting_id,
        sub_meeting_id: meeting_info.sub_meeting_id,
        meeting_code: meeting_info.meeting_code,
        start_time: meeting_info.start_time * 1000,
        end_time: meeting_info.end_time * 1000,
      });

      // 注意：由于用户入库改为异步队列处理，此处无法立即获取 participantRecordId
      // 因此暂时无法在此处进行参会人与会议的关联
      // 后续可能需要通过专门的定时任务或在队列处理完成后进行关联

      this.logger.log(`成功处理会议记录: ${meeting_info.meeting_id}`);
    } catch (error) {
      this.logger.error(
        `处理用户入会事件失败: ${meeting_info.meeting_id}`,
        error,
      );
      // 不抛出错误，避免影响主流程
    }
  }
}
