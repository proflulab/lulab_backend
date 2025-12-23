/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-23 09:15:35
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-23 12:16:43
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/events/meeting-started.handler.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */
import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from '../base/base-event.handler';
import { TencentEventPayload } from '../../types';
import { TencentEventUtils } from '../../utils/tencent-event.utils';
import { MeetingRecordService } from '../../services/meeting-record.service';
import { MeetingUserService } from '../../services/meeting-user.service';
import { TencentMeetingRepository } from '../../repositories/tencent-meeting.repository';
import { Platform, ProcessingStatus } from '@prisma/client';

/**
 * 会议开始事件处理器
 */
@Injectable()
export class MeetingStartedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'meeting.started';

  constructor(
    private readonly meetingRecordService: MeetingRecordService,
    private readonly meetingUserService: MeetingUserService,
    private readonly tencentMeetingRepository: TencentMeetingRepository,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    const { meeting_info, operator } = payload;
    const { creator } = meeting_info;

    const meetingType = TencentEventUtils.convertMeetingType(
      meeting_info.meeting_type as number,
    );

    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    // 准备要处理的用户记录
    const userRecordPromises = [
      this.meetingUserService.upsertMeetingUserRecord(operator),
    ];

    // 如果操作者和创建者不是同一人，添加创建者记录处理
    if (operator.uuid !== creator.uuid) {
      void this.meetingUserService.upsertMeetingUserRecord(creator);
    }

    // 使用 Promise.allSettled 并行执行所有操作，确保任何一个失败都不会影响其他操作
    await Promise.allSettled([
      // 处理用户记录（操作者和创建者）- 飞书多维表格
      Promise.allSettled(userRecordPromises),

      // 创建或更新会议记录 - 飞书多维表格
      this.meetingRecordService.updateMeetingParticipants(
        meeting_info,
        operator,
      ),

      // 创建或更新会议记录 - Prisma数据库
      this.tencentMeetingRepository.upsertMeetingWithPlatformUsers(
        Platform.TENCENT_MEETING,
        meeting_info.meeting_id,
        meeting_info.sub_meeting_id || '__ROOT__',
        {
          title: meeting_info.subject,
          meetingCode: meeting_info.meeting_code,
          type: meetingType,
          scheduledStartAt: new Date(meeting_info.start_time * 1000),
          scheduledEndAt: new Date(meeting_info.end_time * 1000),
          startAt: new Date(meeting_info.start_time * 1000),
          endAt: new Date(meeting_info.end_time * 1000),
          durationSeconds: meeting_info.end_time - meeting_info.start_time,
          hasRecording: false,
          recordingStatus: ProcessingStatus.PENDING,
          processingStatus: ProcessingStatus.PENDING,
        },
        {
          platformUuid: creator.uuid,
          platformUserId: creator.userid,
          platform: Platform.TENCENT_MEETING,
          userName: creator.user_name,
        },
        {
          platformUuid: operator.uuid,
          platformUserId: operator.userid,
          platform: Platform.TENCENT_MEETING,
          userName: operator.user_name,
        },
      ),
    ]);
  }
}
