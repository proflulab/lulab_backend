/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-29 01:59:25
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-04 05:34:54
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/speaker.service.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { Platform, PlatformUser } from '@prisma/client';
import { PlatformUserRepository } from '@/user-platform/repositories/platform-user.repository';
import {
  SpeakerInfo,
  MeetingParticipantDetail,
} from '@/integrations/tencent-meeting/types';
import { NewSpeakerInfo } from '@/hook-tencent-mtg/types';

@Injectable()
export class SpeakerService {
  constructor(
    private readonly platformUserRepository: PlatformUserRepository,
  ) {}

  async enrichSpeakerInfo(
    speakerInfo: SpeakerInfo,
    participants: MeetingParticipantDetail[],
  ): Promise<NewSpeakerInfo> {
    if (!speakerInfo) {
      return speakerInfo;
    }

    const participant = participants.find(
      (p) =>
        (speakerInfo.userid && p.userid === speakerInfo.userid) ||
        (speakerInfo.openId && p.open_id === speakerInfo.openId) ||
        (speakerInfo.ms_open_id && p.ms_open_id === speakerInfo.ms_open_id) ||
        (speakerInfo.username && p.user_name === speakerInfo.username),
    );

    if (!participant) {
      let platformUser: PlatformUser | null = null;
      if (speakerInfo.userid) {
        platformUser = await this.platformUserRepository.findByPtUserId(
          Platform.TENCENT_MEETING,
          speakerInfo.userid,
        );
      }

      if (!platformUser && speakerInfo.username) {
        platformUser = await this.platformUserRepository.findByPtName(
          Platform.TENCENT_MEETING,
          speakerInfo.username,
        );
      }

      if (platformUser) {
        return {
          ...speakerInfo,
          uuid: platformUser.ptUnionId ?? undefined,
          phone: platformUser.phone ?? undefined,
        };
      }

      return speakerInfo;
    }

    return {
      ...speakerInfo,
      uuid: participant.uuid,
      phone: participant.phone,
      instanceid: participant.instanceid,
      user_role: participant.user_role,
      ip: participant.ip,
      location: participant.location,
      link_type: participant.link_type,
      net: participant.net,
      app_version: participant.app_version,
      audio_state: participant.audio_state,
      video_state: participant.video_state,
      screen_shared_state: participant.screen_shared_state,
      webinar_member_role: participant.webinar_member_role,
      customer_data: participant.customer_data,
      is_enterprise_user: participant.is_enterprise_user,
      tm_corpid: participant.tm_corpid,
      avatar_url: participant.avatar_url,
    };
  }
}
