/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-13 02:54:40
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-25 06:52:05
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/events/recording-completed.handler.ts
 * @Description: 录制完成事件处理器
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from '../base/base-event.handler';
import { TencentEventPayload } from '../../types';
import { NumberRecordBitableRepository } from '@/integrations/lark/repositories';
import { MeetingParticipantDetail } from '@/integrations/tencent-meeting/types';
import { OpenaiService } from '@/integrations/openai/openai.service';
import { RecordingContentService } from '../../services/recording-content.service';
import { TranscriptService } from '../../services/transcript.service';
import { MeetingBitableService } from '../../services/meeting-bitable.service';
import { MeetingParticipantService } from '../../services/meeting-participant.service';
import { PARTICIPANT_SUMMARY_PROMPT } from '../../constants/prompts';

/**
 * 录制完成事件处理器
 */

@Injectable()
export class RecordingCompletedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'recording.completed';

  constructor(
    private readonly numberRecordBitable: NumberRecordBitableRepository,
    private readonly openaiService: OpenaiService,
    private readonly recordingContentService: RecordingContentService,
    private readonly transcriptService: TranscriptService,
    private readonly bitableService: MeetingBitableService,
    private readonly participantService: MeetingParticipantService,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    const { meeting_info, recording_files = [] } = payload;
    const { meeting_id, sub_meeting_id } = meeting_info;
    const creatorUserId = meeting_info.creator.userid || '';

    // 获取会议参与者列表并根据 uuid 去重
    const uniqueParticipants: MeetingParticipantDetail[] =
      await this.participantService.getUniqueParticipants(
        meeting_id,
        creatorUserId,
        sub_meeting_id,
      );

    // 处理录制文件记录
    for (const file of recording_files) {
      const fileId = file.record_file_id;

      try {
        // 获取智能摘要、待办事项和会议纪要
        let { fullsummary = '', todo = '', ai_minutes = '' } = {};
        // 获取录音转写内容
        let formattedTranscript = '';
        let uniqueUsernames: string[] = [];

        const [meetingContentResult, transcriptResult] =
          await Promise.allSettled([
            this.recordingContentService.getMeetingContent(
              fileId,
              creatorUserId,
            ),
            this.transcriptService.getTranscript(fileId, creatorUserId),
          ]);

        // 处理会议内容结果
        if (meetingContentResult.status === 'fulfilled') {
          ({ fullsummary, todo, ai_minutes } = meetingContentResult.value);
        } else {
          this.logger.warn(`获取会议内容失败: ${fileId}`);
        }

        // 处理转写内容结果
        if (transcriptResult.status === 'fulfilled') {
          formattedTranscript = transcriptResult.value.formattedTranscript;
          uniqueUsernames = transcriptResult.value.uniqueUsernames;
        } else {
          this.logger.warn(`获取录音转写失败: ${fileId}`);
        }

        // 创建会议记录和录制文件记录
        const recordingRecordId =
          await this.bitableService.upsertRecordingFileRecord(
            fileId,
            meeting_info,
            fullsummary,
            todo,
            ai_minutes,
            uniqueUsernames.join(','),
            formattedTranscript,
          );

        // 对参会者逐个进行会议总结

        for (const u of uniqueParticipants) {
          const uId = await this.bitableService.safeUpsertMeetingUserRecord(u);

          if (uniqueUsernames.find((uName) => uName === u.user_name)) {
            // 构建参会者的会议总结提示词
            const participantSummaryPrompt = PARTICIPANT_SUMMARY_PROMPT(
              meeting_info.subject,
              new Date(meeting_info.start_time * 1000).toLocaleString(),
              new Date(meeting_info.end_time * 1000).toLocaleString(),
              u.user_name,
              ai_minutes || '暂无会议纪要',
              todo || '暂无待办事项',
              formattedTranscript || '暂无录音转写',
            );

            // 调用OpenAI生成个性化总结
            const participantSummary = await this.openaiService.ask(
              participantSummaryPrompt,
              '你是专业的会议总结助手，擅长为参会者提供个性化、实用的会议总结。',
            );

            this.logger.log(`成功生成参会者: ${u.user_name}总结`);

            // 保存参会者总结到number_record表，填入记录id
            await this.numberRecordBitable.upsertNumberRecord({
              meet_participant: [uId],
              participant_summary: participantSummary,
              record_file: [recordingRecordId ?? ''],
            });
            this.logger.log(`参会者 ${u.user_name}总结记录已保存`);
          }
        }
      } catch (error: unknown) {
        this.logger.error(
          `处理录制文件处理失败: ${file.record_file_id}`,
          error instanceof Error ? error.stack : undefined,
        );
        // 不抛出错误，避免影响主流程
      }
    }
  }
}
