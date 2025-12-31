/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-24
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-31 18:01:23
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/meeting-database.service.ts
 * @Description: 会议数据库服务，处理会议记录的创建和更新
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import {
  TencentMeetingInfoPayload,
  Meetuser,
} from '../types/tencent-event.types';
import { TencentEventUtils } from '../utils/tencent-event.utils';
import { TencentMeetingRepository } from '../repositories/tencent-meeting.repository';
import { PlatformUserRepository } from '@/user-platform/repositories/platform-user.repository';
import { Platform, ProcessingStatus } from '@prisma/client';

/**
 * 会议数据库服务
 * 提供会议记录的创建和更新功能
 */
@Injectable()
export class MeetingDatabaseService {
  constructor(
    private readonly tencentMeetingRepository: TencentMeetingRepository,
    private readonly platformUserRepository: PlatformUserRepository,
  ) {}

  /**
   * 创建或更新会议记录
   * @param payload 腾讯会议事件载荷
   */
  async upsertMeetingRecord(payload: TencentMeetingInfoPayload): Promise<void> {
    const { meeting_info } = payload;

    if (!meeting_info) {
      throw new Error('Meeting info is required but not provided');
    }

    const { creator } = meeting_info;

    const meetingType = TencentEventUtils.convertMeetingType(
      meeting_info.meeting_type as number,
    );

    await this.tencentMeetingRepository.upsertMeetingWithPlatformUsers(
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
        platformUuid: creator.uuid,
        platformUserId: creator.userid,
        platform: Platform.TENCENT_MEETING,
        userName: creator.user_name,
      },
    );
  }

  /**
   * 创建或更新平台用户记录
   * @param user 用户信息
   */
  async upsertPlatformUser(user: Meetuser) {
    if (!user.uuid) {
      throw new Error(
        `User UUID is required but not provided for user ${user.user_name || 'unknown'}`,
      );
    }

    try {
      await this.platformUserRepository.upsertPlatformUser(
        {
          platform: Platform.TENCENT_MEETING,
          platformUuid: user.uuid,
        },
        {
          platform: Platform.TENCENT_MEETING,
          platformUuid: user.uuid,
          platformUserId: user.userid,
          userName: user.user_name,
          platformData: {
            instance_id: user.instance_id,
            ms_open_id: user.ms_open_id,
          },
        },
        {
          platformUserId: user.userid,
          userName: user.user_name,
          platformData: {
            instance_id: user.instance_id,
            ms_open_id: user.ms_open_id,
          },
        },
      );
    } catch (error) {
      throw new Error(
        `Failed to upsert platform user for user ${user.uuid}: ${(error as Error).message}`,
      );
    }
  }
}
