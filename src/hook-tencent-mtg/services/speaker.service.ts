/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-29 01:59:25
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-29 03:16:52
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
  async findOrCreateSpeaker(
    tx: PrismaTransaction,
    speakerInfo: SpeakerInfo,
    participants: MeetingParticipantDetail[],
  ): Promise<string | undefined> {
    if (!speakerInfo) {
      return undefined;
    }

    let speakerUuid: string | undefined;

    const participantByUserid = participants.find(
      (p) => p.userid === speakerInfo.userid,
    );
    if (participantByUserid) {
      speakerUuid = participantByUserid.uuid;
    } else {
      const participantByMsOpenId = participants.find(
        (p) => p.ms_open_id === speakerInfo.ms_open_id,
      );
      if (participantByMsOpenId) {
        speakerUuid = participantByMsOpenId.uuid;
      } else {
        const participantByUsername = participants.find(
          (p) => p.user_name === speakerInfo.username,
        );
        if (participantByUsername) {
          speakerUuid = participantByUsername.uuid;
        }
      }
    }

    if (!speakerUuid) {
      return undefined;
    }

    const speaker = await tx.platformUser.findFirst({
      where: {
        platform: Platform.TENCENT_MEETING,
        platformUuid: speakerUuid,
      },
    });

    if (speaker) {
      return speaker.id;
    }

    const participant = participants.find((p) => p.uuid === speakerUuid);
    if (participant) {
      const newSpeaker = await tx.platformUser.create({
        data: {
          platform: Platform.TENCENT_MEETING,
          platformUuid: speakerUuid,
          userName: participant.user_name,
          isActive: true,
        },
      });
      return newSpeaker.id;
    }

    return undefined;
  }
}
