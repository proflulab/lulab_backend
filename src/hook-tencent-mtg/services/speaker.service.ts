/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-29 01:59:25
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-02 05:09:49
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/speaker.service.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { Platform } from '@prisma/client';
import { PrismaTransaction } from '@/hook-tencent-mtg/types';
import { SpeakerInfo } from '@/integrations/tencent-meeting/types';
import { MeetingParticipantDetail } from '@/integrations/tencent-meeting/types';

@Injectable()
export class SpeakerService {
  /**
   * 根据发言人信息匹配参与者
   * @param speakerInfos 发言人信息数组
   * @param uniqueParticipants 唯一参与者数组
   * @returns 匹配到的参与者数组
   */
  matchParticipantsWithSpeakers(
    speakerInfos: SpeakerInfo[],
    uniqueParticipants: MeetingParticipantDetail[],
  ): MeetingParticipantDetail[] {
    if (!speakerInfos || speakerInfos.length === 0) {
      return [];
    }

    const matchedParticipants: MeetingParticipantDetail[] = [];

    for (const speakerInfo of speakerInfos) {
      const matchedParticipant = this.matchParticipant(
        speakerInfo,
        uniqueParticipants,
      );

      if (matchedParticipant) {
        matchedParticipants.push(matchedParticipant);
      }
    }

    return matchedParticipants;
  }

  /**
   * 根据单个发言人信息匹配参与者
   * @param speakerInfo 发言人信息
   * @param participants 参与者数组
   * @returns 匹配到的参与者，未匹配则返回 undefined
   */
  private matchParticipant(
    speakerInfo: SpeakerInfo,
    participants: MeetingParticipantDetail[],
  ): MeetingParticipantDetail | undefined {
    for (const participant of participants) {
      const matchByUserid =
        speakerInfo.userid &&
        participant.userid &&
        speakerInfo.userid === participant.userid;

      const matchByMsOpenId =
        speakerInfo.ms_open_id &&
        participant.ms_open_id &&
        speakerInfo.ms_open_id === participant.ms_open_id;

      const matchByUsername =
        speakerInfo.username &&
        participant.user_name &&
        speakerInfo.username === participant.user_name;

      if (matchByUserid || matchByMsOpenId || matchByUsername) {
        return participant;
      }
    }

    return undefined;
  }

  async findOrCreateSpeaker(
    tx: PrismaTransaction,
    speakerInfo: SpeakerInfo,
    participants: MeetingParticipantDetail[],
  ): Promise<string | undefined> {
    if (!speakerInfo) {
      return undefined;
    }

    const matchedParticipant = this.matchParticipant(speakerInfo, participants);

    if (!matchedParticipant) {
      return undefined;
    }

    const speakerUuid = matchedParticipant.uuid;

    const speaker = await tx.platformUser.findFirst({
      where: {
        platform: Platform.TENCENT_MEETING,
        platformUuid: speakerUuid,
      },
    });

    if (speaker) {
      return speaker.id;
    }

    const newSpeaker = await tx.platformUser.create({
      data: {
        platform: Platform.TENCENT_MEETING,
        platformUuid: speakerUuid,
        userName: matchedParticipant.user_name,
        isActive: true,
      },
    });
    return newSpeaker.id;
  }
}
