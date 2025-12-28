/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-13 02:54:40
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-07 01:50:25
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/event-handlers/recording-completed.handler.ts
 * @Description: 录制完成事件处理器
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from './base-event.handler';
import { TencentEventPayload } from '../../types/tencent-webhook-events.types';
import {
  MeetingBitableRepository,
  MeetingUserBitableRepository,
  RecordingFileBitableRepository,
  NumberRecordBitableRepository,
} from '@/integrations/lark/repositories';
import { TencentApiService } from '@/integrations/tencent-meeting/api.service';
import { MeetingParticipantDetail } from '@/integrations/tencent-meeting/types';
import { OpenaiService } from '@/integrations/openai/openai.service';

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

    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    // 记录会议信息
    this.logger.log(
      `录制完成 [${index}]: ${meeting_info.subject} (${meeting_info.meeting_code})`,
    );

    let meetingRecordId: string | undefined;

    try {
      const meetingResult = await this.MeetingBitable.upsertMeetingRecord({
        platform: '腾讯会议',
        subject: meeting_info.subject,
        meeting_id: meeting_info.meeting_id,
        sub_meeting_id: meeting_info.sub_meeting_id,
        meeting_code: meeting_info.meeting_code,
        start_time: meeting_info.start_time * 1000,
        end_time: meeting_info.end_time * 1000,
      });

      if (meetingResult.data?.record) {
        meetingRecordId = meetingResult.data.record.record_id;
        this.logger.log(`操作者记录ID: ${meetingRecordId}`);
      }
    } catch (error: unknown) {
      this.logger.error(
        `处理录制完成事件失败: ${meeting_info.meeting_id}`,
        error instanceof Error ? error.stack : undefined,
      );
      // 不抛出错误，避免影响主流程
    }

    // 处理录制文件记录
    if (recording_files && recording_files.length > 0) {
      this.logger.log(
        `开始处理录制文件 [${index}]: 共 ${recording_files.length} 个文件`,
      );

      for (const file of recording_files) {
        try {
          const meetIds: string[] = meetingRecordId ? [meetingRecordId] : [];

          // 获取智能摘要、待办事项和会议纪要
          let fullsummary = '';
          let todo = '';
          let ai_minutes = '';

          try {
            // 获取智能全文摘要
            const summaryResponse =
              await this.tencentMeetingApi.getSmartFullSummary(
                file.record_file_id,
                meeting_info.creator.userid || '',
              );
            fullsummary =
              Buffer.from(summaryResponse.ai_summary, 'base64').toString(
                'utf-8',
              ) || '';
            this.logger.log(`获取智能摘要成功: ${file.record_file_id}`);
          } catch (error: unknown) {
            const errorMessage = this.getErrorMessage(error);
            this.logger.warn(
              `获取智能摘要失败: ${file.record_file_id}, 错误: ${errorMessage}`,
            );
          }

          try {
            // 获取智能会议纪要（包含待办事项）
            const minutesResponse =
              await this.tencentMeetingApi.getSmartMeetingMinutes(
                file.record_file_id,
                meeting_info.creator.userid || '',
              );
            ai_minutes = minutesResponse.meeting_minute?.minute || '';
            todo = minutesResponse.meeting_minute?.todo || '';
            this.logger.log(`获取会议纪要成功: ${file.record_file_id}`);
          } catch (error: unknown) {
            const errorMessage = this.getErrorMessage(error);
            this.logger.warn(
              `获取会议纪要失败: ${file.record_file_id}, 错误: ${errorMessage}`,
            );
          }

          // 获取录音转写内容
          let formattedTranscript = '';
          const uniqueUsernames = new Set<string>(); // 用于存储所有唯一的用户名

          try {
            const transcriptResponse =
              await this.tencentMeetingApi.getTranscript(
                file.record_file_id,
                meeting_info.creator.userid || '',
              );

            if (transcriptResponse.minutes?.paragraphs) {
              // 提取所有唯一的用户名
              for (const paragraph of transcriptResponse.minutes.paragraphs) {
                const speakerName =
                  paragraph.speaker_info?.username || '未知发言人';
                uniqueUsernames.add(speakerName);
              }

              // 格式化转写内容为指定格式 - 将每个段落的所有句子组合成段落
              const formattedLines: string[] = [];

              for (const paragraph of transcriptResponse.minutes.paragraphs) {
                const speakerName =
                  paragraph.speaker_info?.username || '未知发言人';

                // 转换第一个句子的时间戳为小时:分钟:秒格式
                const firstSentence = paragraph.sentences[0];
                if (firstSentence) {
                  const startTime = firstSentence.start_time;
                  const hours = Math.floor(startTime / 3600000); // 转换为小时
                  const minutes = Math.floor((startTime % 3600000) / 60000); // 剩余的分钟
                  const seconds = Math.floor((startTime % 60000) / 1000); // 剩余的秒
                  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                  // 将段落中的所有句子组合成一个段落文本
                  const paragraphText = paragraph.sentences
                    .map((sentence) =>
                      sentence.words.map((word) => word.text).join(''),
                    )
                    .join('')
                    .trim();

                  if (paragraphText) {
                    formattedLines.push(
                      `${speakerName}(${timeString})：${paragraphText}`,
                    );
                  }
                }
              }

              formattedTranscript = formattedLines.join('\n\n');
              this.logger.log(
                `获取录音转写成功: ${file.record_file_id}, 共 ${formattedLines.length} 条记录, 提取到 ${uniqueUsernames.size} 个唯一用户名`,
              );
            }
          } catch (error: unknown) {
            const errorMessage = this.getErrorMessage(error);
            this.logger.warn(
              `获取录音转写失败: ${file.record_file_id}, 错误: ${errorMessage}`,
            );
          }

          // 获取会议参与者列表并根据 uuid 去重
          let uniqueParticipants: MeetingParticipantDetail[] = [];

          try {
            const participantsResponse =
              await this.tencentMeetingApi.getParticipants(
                meeting_info.meeting_id,
                meeting_info.creator.userid || '',
                meeting_info.sub_meeting_id,
              );

            // 根据 uuid 去重
            const seenUuids = new Set<string>();
            uniqueParticipants = participantsResponse.participants
              .filter((participant) => {
                if (seenUuids.has(participant.uuid)) {
                  return false;
                }
                seenUuids.add(participant.uuid);
                return true;
              })
              .map((participant) => ({
                ...participant,
                user_name: Buffer.from(
                  participant.user_name,
                  'base64',
                ).toString('utf-8'),
              }));

            this.logger.log(
              `获取会议参与者成功: ${meeting_info.meeting_id}, 共 ${uniqueParticipants.length} 个唯一参与者`,
            );
          } catch (error: unknown) {
            const errorMessage = this.getErrorMessage(error);
            this.logger.warn(
              `获取会议参与者失败: ${meeting_info.meeting_id}, 错误: ${errorMessage}`,
            );
          }

          const recordingResult =
            await this.recordingFileBitable.upsertRecordingFileRecord({
              record_file_id: file.record_file_id,
              meet: meetIds,
              start_time: meeting_info.start_time * 1000,
              end_time: meeting_info.end_time * 1000,
              fullsummary,
              todo,
              ai_minutes,
              participants: uniqueParticipants
                .map((p) => p.user_name)
                .toString(),
              ai_meeting_transcripts: formattedTranscript,
            });

          if (recordingResult.data?.record) {
            this.logger.log(
              `录制文件记录已创建/更新: ${file.record_file_id} (记录ID: ${recordingResult.data.record.record_id})`,
            );
          }

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
                record_file: [recordingResult.data?.record.record_id ?? ''],
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
    } else {
      this.logger.log(`该会议没有录制文件 [${index}]: ${meeting_info.subject}`);
    }
  }
}
