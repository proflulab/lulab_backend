/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-13 02:54:40
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-24 19:34:56
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/events/recording-completed.handler.ts
 * @Description: 录制完成事件处理器
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from '../base/base-event.handler';
import { TencentEventPayload } from '../../types';
import {
  MeetingBitableRepository,
  MeetingUserBitableRepository,
  RecordingFileBitableRepository,
  NumberRecordBitableRepository,
} from '@/integrations/lark/repositories';
import { TencentApiService } from '@/integrations/tencent-meeting/api.service';
import { MeetingParticipantDetail } from '@/integrations/tencent-meeting/types';
import { OpenaiService } from '@/integrations/openai/openai.service';
import { RecordingContentService } from '../../services/recording-content.service';
import { TranscriptService } from '../../services/transcript.service';
import { MeetingBitableService } from '../../services/meeting-bitable.service';
import { MeetingParticipantService } from '../../services/meeting-participant.service';

/**
 * 录制完成事件处理器
 */
@Injectable()
export class RecordingCompletedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'recording.completed';

  constructor(
    private readonly MeetingBitable: MeetingBitableRepository,
    private readonly meetingUserBitable: MeetingUserBitableRepository,
    private readonly recordingFileBitable: RecordingFileBitableRepository,
    private readonly numberRecordBitable: NumberRecordBitableRepository,
    private readonly tencentMeetingApi: TencentApiService,
    private readonly openaiService: OpenaiService,
    private readonly recordingContentService: RecordingContentService,
    private readonly transcriptService: TranscriptService,
    private readonly meetingBitableService: MeetingBitableService,
    private readonly meetingParticipantService: MeetingParticipantService,
  ) {
    super();
  }

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

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    const { meeting_info, recording_files = [] } = payload;
    const { meeting_id, sub_meeting_id } = meeting_info;
    const creatorUserId = meeting_info.creator.userid || '';

    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    // 记录会议信息
    this.logger.log(
      `录制完成 [${index}]: ${meeting_info.subject} (${meeting_info.meeting_code})`,
    );

    // 处理录制文件记录

    for (const file of recording_files) {
      try {
        // 获取智能摘要、待办事项和会议纪要
        let fullsummary = '';
        let todo = '';
        let ai_minutes = '';

        try {
          const meetingContent =
            await this.recordingContentService.getMeetingContent(
              file.record_file_id,
              meeting_info.creator.userid || '',
            );

          fullsummary = meetingContent.fullsummary;
          todo = meetingContent.todo;
          ai_minutes = meetingContent.ai_minutes;

          this.logger.log(`获取会议内容成功: ${file.record_file_id}`);
        } catch (error: unknown) {
          const errorMessage = this.getErrorMessage(error);
          this.logger.warn(
            `获取会议内容失败: ${file.record_file_id}, 错误: ${errorMessage}`,
          );
        }

        // 获取录音转写内容
        let formattedTranscript = '';
        let uniqueUsernames: string[] = [];

        try {
          const transcriptResult = await this.transcriptService.getTranscript(
            file.record_file_id,
            meeting_info.creator.userid || '',
          );

          formattedTranscript = transcriptResult.formattedTranscript;
          uniqueUsernames = transcriptResult.uniqueUsernames;
        } catch (error: unknown) {
          const errorMessage = this.getErrorMessage(error);
          this.logger.warn(
            `获取录音转写失败: ${file.record_file_id}, 错误: ${errorMessage}`,
          );
        }

        // 获取会议参与者列表并根据 uuid 去重
        const uniqueParticipants: MeetingParticipantDetail[] =
          await this.meetingParticipantService.getUniqueParticipants(
            meeting_id,
            creatorUserId,
            sub_meeting_id,
          );

        // 创建会议记录和录制文件记录
        const meetingRecordId =
          await this.meetingBitableService.createMeetingRecord(meeting_info);

        const recordingRecordId =
          await this.meetingBitableService.createRecordingFileRecord(
            file.record_file_id,
            meetingRecordId,
            meeting_info,
            fullsummary,
            todo,
            ai_minutes,
            uniqueParticipants,
            formattedTranscript,
          );

        // 更新用户表
        for (const participant of uniqueParticipants) {
          try {
            await this.meetingUserBitable.upsertMeetingUserRecord({
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

        // 对参会者逐个进行会议总结
        this.logger.log(
          `开始对参会者进行个性化会议总结 [${index}]: 共 ${uniqueParticipants.length} 个参与者`,
        );

        for (const username of uniqueUsernames) {
          try {
            // 根据username的值匹配uniqueParticipants的user_name来获取uuid
            const participant = uniqueParticipants.find(
              (p) => p.user_name === username,
            );

            let participantRecordIds: string[] = [];

            if (participant) {
              try {
                // 通过uuid请求获取记录id
                const searchResult =
                  await this.meetingUserBitable.searchMeetingUserByUuid(
                    participant.uuid,
                  );

                // 解析搜索结果获取记录ID
                const searchData = searchResult as {
                  data?: { items?: Array<{ record_id: string }> };
                };

                if (
                  searchData.data?.items &&
                  searchData.data.items.length > 0
                ) {
                  participantRecordIds = searchData.data.items.map(
                    (item) => item.record_id,
                  );
                  this.logger.log(
                    `找到参会者记录: ${username} (uuid: ${participant.uuid}), 记录ID: ${participantRecordIds.join(', ')}`,
                  );
                } else {
                  this.logger.warn(
                    `未找到参会者记录: ${username} (uuid: ${participant.uuid})`,
                  );
                }
              } catch (error: unknown) {
                const errorMessage = this.getErrorMessage(error);
                this.logger.warn(
                  `搜索参会者记录失败: ${username}, 错误: ${errorMessage}`,
                );
              }
            } else {
              this.logger.warn(`在会议参与者中未找到匹配的用户: ${username}`);
            }

            // 构建参会者的会议总结提示词
            const participantSummaryPrompt = `
你是专业的会议总结助手，请为参会者提供个性化的会议总结。

会议信息：
- 会议主题：${meeting_info.subject}
- 会议时间：${new Date(meeting_info.start_time * 1000).toLocaleString()} - ${new Date(meeting_info.end_time * 1000).toLocaleString()}
- 参会者：${username}

会议内容：
${ai_minutes || '暂无会议纪要'}

待办事项：
${todo || '暂无待办事项'}

录音转写：
${formattedTranscript || '暂无录音转写'}

请为参会者「${username}」生成一份个性化的会议总结，包含：
1. 会议要点回顾
2. 与该参会者相关的重要讨论
3. 该参会者需要关注的待办事项
4. 后续行动建议

请用中文回答，保持简洁专业。
              `.trim();

            // 调用OpenAI生成个性化总结
            const participantSummary = await this.openaiService.ask(
              participantSummaryPrompt,
              '你是专业的会议总结助手，擅长为参会者提供个性化、实用的会议总结。',
            );

            this.logger.log(`生成参会者总结成功: ${username}`);

            // 保存参会者总结到number_record表，填入记录id
            await this.numberRecordBitable.upsertNumberRecord({
              meet_participant: participantRecordIds,
              participant_summary: participantSummary,
              record_file: [recordingRecordId ?? ''],
            });

            this.logger.log(`参会者总结记录已保存: ${username}`);
          } catch (error: unknown) {
            const errorMessage = this.getErrorMessage(error);
            this.logger.warn(
              `生成参会者总结失败: ${username}, 错误: ${errorMessage}`,
            );
            // 不抛出错误，避免影响主流程
          }
        }
      } catch (error: unknown) {
        this.logger.error(
          `处理录制文件失败: ${file.record_file_id}`,
          error instanceof Error ? error.stack : undefined,
        );
        // 不抛出错误，避免影响主流程
      }
    }
  }
}
