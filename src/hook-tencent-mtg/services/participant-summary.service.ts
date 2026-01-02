/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-24 00:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-02 07:16:20
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/participant-summary.service.ts
 * @Description: 参会者总结服务，负责为每个参会者生成个性化会议总结
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import pLimit from 'p-limit';
import { Injectable, Logger } from '@nestjs/common';
import { PARTICIPANT_SUMMARY_PROMPT } from '../constants/prompts';
import { RecordingItem } from '../types/recording-aggregate.types';
import { StartedMeetingInfo } from '../types/tencent-event.types';
import { MeetingParticipantDetail } from '@/integrations/tencent-meeting/types';
import { OpenaiService } from '@/integrations/openai/openai.service';

export interface ParticipantSummaryResult {
  uuid: string;
  user_id: string;
  user_name: string;
  participantSummary: string;
}

export interface GenerateParticipantSummariesResult {
  success: ParticipantSummaryResult[];
  failed: Array<{
    user: MeetingParticipantDetail;
    reason: unknown;
  }>;
}

@Injectable()
export class ParticipantSummaryService {
  private readonly logger = new Logger(ParticipantSummaryService.name);

  constructor(private readonly openaiService: OpenaiService) {}

  async generateParticipantSummaries(
    meetingInfo: StartedMeetingInfo,
    recordings: RecordingItem,
  ): Promise<GenerateParticipantSummariesResult> {
    const limit = pLimit(5);

    const users = recordings.matchedParticipants;
    const recording = recordings;

    const ai_minutes = recording?.ai_minutes || '暂无会议纪要';
    const todo = recording?.todo || '暂无待办事项';
    const transcript = recording?.formattedTranscript || '暂无录音转写';

    const tasks = users.map((u) =>
      limit(async () => {
        const participantSummaryPrompt = PARTICIPANT_SUMMARY_PROMPT(
          meetingInfo.subject,
          new Date(meetingInfo.start_time * 1000).toLocaleString(),
          new Date(meetingInfo.end_time * 1000).toLocaleString(),
          u.user_name,
          ai_minutes,
          todo,
          transcript,
        );

        const participantSummary = await this.openaiService.ask(
          participantSummaryPrompt,
          '你是专业的会议总结助手，擅长为参会者提供个性化、实用的会议总结。',
        );

        return {
          uuid: u.uuid,
          user_id: u.userid,
          user_name: u.user_name,
          participantSummary,
        };
      }),
    );

    const settled = await Promise.allSettled(tasks);

    const success = settled
      .filter(
        (r): r is PromiseFulfilledResult<ParticipantSummaryResult> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value);

    const failed = settled
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r, index) => ({
        user: users[index],
        reason: r.reason as Error,
      }));

    this.logger.log(
      `参会者总结生成完成: 成功 ${success.length} 个, 失败 ${failed.length} 个`,
    );

    if (failed.length > 0) {
      this.logger.warn(
        `失败的参会者总结: ${failed.map((f) => f.user.user_name).join(', ')}`,
      );
    }

    return {
      success,
      failed,
    };
  }
}
