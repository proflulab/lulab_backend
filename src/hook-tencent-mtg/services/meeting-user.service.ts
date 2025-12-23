/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-23 09:06:34
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-23 09:06:55
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/meeting-user.service.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { TencentEventOperator, TencentMeetingCreator } from '../types';
import { MeetingUserBitableRepository } from '../../integrations/lark/repositories';

/**
 * 会议用户服务
 * 提供会议用户记录的创建和更新功能
 */
@Injectable()
export class MeetingUserService {
  constructor(
    private readonly meetingUserBitable: MeetingUserBitableRepository,
  ) {}

  /**
   * 创建或更新会议用户记录
   * @param user 用户信息
   */
  async upsertMeetingUserRecord(
    user: TencentEventOperator | TencentMeetingCreator,
  ): Promise<string> {
    try {
      const result = await this.meetingUserBitable.upsertMeetingUserRecord({
        uuid: user.uuid,
        userid: user.userid,
        user_name: user.user_name,
        is_enterprise_user: !!user.userid,
      });

      return result.data?.record?.record_id || '';
    } catch (error) {
      throw new Error(
        `Failed to upsert meeting user record for user ${user.uuid}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 根据UUID查找会议用户记录
   * @param uuid 用户UUID
   */
  async findMeetingUserByUuid(uuid: string) {
    try {
      return await this.meetingUserBitable.searchMeetingUserByUuid(uuid);
    } catch (error) {
      throw new Error(
        `Failed to find meeting user record for uuid ${uuid}: ${(error as Error).message}`,
      );
    }
  }
}
