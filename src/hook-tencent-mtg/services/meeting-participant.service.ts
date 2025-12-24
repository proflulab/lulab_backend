/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-24 00:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-24 00:00:00
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/meeting-participant.service.ts
 * @Description: 会议参与者服务，负责处理会议参与者相关逻辑
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable, Logger } from '@nestjs/common';
import { TencentApiService } from '@/integrations/tencent-meeting/api.service';
import { MeetingParticipantDetail } from '@/integrations/tencent-meeting/types';
import { MeetingUserBitableRepository } from '@/integrations/lark/repositories';

/**
 * 会议参与者服务
 * 负责处理会议参与者相关逻辑
 */
@Injectable()
export class MeetingParticipantService {
  private readonly logger = new Logger(MeetingParticipantService.name);

  constructor(private readonly tencentMeetingApi: TencentApiService) {}

  /**
   * 获取唯一的会议参与者列表
   * @param meetingId 会议ID
   * @param userId 用户ID
   * @param subMeetingId 子会议ID
   * @returns 去重后的参与者列表
   */
  async getUniqueParticipants(
    meetingId: string,
    userId: string,
    subMeetingId?: string,
  ): Promise<MeetingParticipantDetail[]> {
    try {
      const participantsResponse = await this.tencentMeetingApi.getParticipants(
        meetingId,
        userId,
        subMeetingId,
      );

      // 根据 uuid 去重
      const seenUuids = new Set<string>();
      const uniqueParticipants = participantsResponse.participants
        .filter((participant) => {
          if (seenUuids.has(participant.uuid)) {
            return false;
          }
          seenUuids.add(participant.uuid);
          return true;
        })
        .map((participant) => ({
          ...participant,
          user_name: Buffer.from(participant.user_name, 'base64').toString(
            'utf-8',
          ),
        }));

      this.logger.log(
        `获取会议参与者成功: ${meetingId}, 共 ${uniqueParticipants.length} 个唯一参与者`,
      );

      return uniqueParticipants;
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.warn(
        `获取会议参与者失败: ${meetingId}, 错误: ${errorMessage}`,
      );
      return [];
    }
  }

  /**
   * 更新用户记录
   * @param participants 参与者列表
   * @param meetingUserBitable 用户记录仓库
   */
  async updateUserRecords(
    participants: MeetingParticipantDetail[],
    meetingUserBitable: MeetingUserBitableRepository,
  ): Promise<void> {
    for (const participant of participants) {
      try {
        await meetingUserBitable.upsertMeetingUserRecord({
          userid: participant.userid,
          uuid: participant.uuid,
          user_name: participant.user_name,
          phone_hase: participant.phone,
          is_enterprise_user: participant.is_enterprise_user,
        });

        this.logger.log(
          `用户记录已创建/更新: ${participant.user_name} (${participant.uuid})`,
        );
      } catch (error: unknown) {
        const errorMessage = this.getErrorMessage(error);
        this.logger.warn(
          `更新用户记录失败: ${participant.user_name} (${participant.uuid}), 错误: ${errorMessage}`,
        );
      }
    }
  }

  /**
   * 获取错误消息
   * @param error 错误对象
   * @returns 错误消息字符串
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
