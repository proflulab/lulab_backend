/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-23 04:23:42
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-24 05:00:00
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/events/meeting-participant-joined.handler.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from '../base/base-event.handler';
import { TencentEventPayload } from '../../types';
import { MeetingBitableService } from '../../services/meeting-bitable.service';
import { MeetingDatabaseService } from '../../services/meeting-database.service';

/**
 * Meeting participant joined event handler
 * Handles meeting.participant-joined events
 */
@Injectable()
export class MeetingParticipantJoinedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'meeting.participant-joined';

  constructor(
    private readonly meetingBitableService: MeetingBitableService,
    private readonly meetingDatabaseService: MeetingDatabaseService,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    const { meeting_info, operator } = payload;

    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    // 使用 Promise.allSettled 并行执行四个操作
    await Promise.allSettled([
      // (Prisma)创建或更新会议参与者信息
      this.meetingDatabaseService.upsertPlatformUser(operator),

      // (Bitable)创建或更新会议创建者信息
      this.meetingBitableService.upsertMeetingUserRecord(meeting_info.creator),
      this.meetingBitableService.upsertMeetingUserRecord(operator),
      // (Bitable)更新会议记录的参与者列表
      this.meetingBitableService.updateMeetingParticipants(
        meeting_info,
        operator,
      ),
    ]);
  }
}
