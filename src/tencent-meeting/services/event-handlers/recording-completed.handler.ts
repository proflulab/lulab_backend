/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-13 02:54:40
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-09-13 03:27:25
 * @FilePath: /lulab_backend/src/tencent-meeting/services/event-handlers/recording-completed.handler.ts
 * @Description:
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
} from '../../../integrations/lark/repositories';
import { TencentApiService } from '../../../integrations/tencent-meeting/api.service';
import { MeetingParticipantDetail } from '../../../integrations/tencent-meeting/types';

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
    private readonly tencentMeetingApi: TencentApiService,
  ) {
    super();
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
            fullsummary = summaryResponse.ai_summary || '';
            this.logger.log(`获取智能摘要成功: ${file.record_file_id}`);
          } catch (error) {
            this.logger.warn(
              `获取智能摘要失败: ${file.record_file_id}, 错误: ${error.message}`,
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
          } catch (error) {
            this.logger.warn(
              `获取会议纪要失败: ${file.record_file_id}, 错误: ${error.message}`,
            );
          }

          // 获取录音转写内容
          let formattedTranscript = '';
          try {
            const transcriptResponse =
              await this.tencentMeetingApi.getTranscript(
                file.record_file_id,
                meeting_info.creator.userid || '',
              );
            
            if (transcriptResponse.minutes?.paragraphs) {
              // 格式化转写内容为指定格式
              const formattedLines: string[] = [];
              
              for (const paragraph of transcriptResponse.minutes.paragraphs) {
                const speakerName = paragraph.speaker_info?.username || '未知发言人';
                
                for (const sentence of paragraph.sentences) {
                  // 转换时间戳为分钟:秒格式
                  const startTime = sentence.start_time;
                  const minutes = Math.floor(startTime / 60000); // 转换为分钟
                  const seconds = Math.floor((startTime % 60000) / 1000); // 剩余的秒
                  
                  // 获取句子文本（从words数组中提取）
                  const sentenceText = sentence.words
                    .map(word => word.text)
                    .join('');
                  
                  if (sentenceText.trim()) {
                    formattedLines.push(`${speakerName}(${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}): ${sentenceText.trim()}`);
                  }
                }
              }
              
              formattedTranscript = formattedLines.join('\n');
              this.logger.log(`获取录音转写成功: ${file.record_file_id}, 共 ${formattedLines.length} 条记录`);
            }
          } catch (error) {
            this.logger.warn(
              `获取录音转写失败: ${file.record_file_id}, 错误: ${error.message}`,
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
            uniqueParticipants = participantsResponse.participants.filter(
              (participant) => {
                if (seenUuids.has(participant.uuid)) {
                  return false;
                }
                seenUuids.add(participant.uuid);
                return true;
              },
            );

            this.logger.log(
              `获取会议参与者成功: ${meeting_info.meeting_id}, 共 ${uniqueParticipants.length} 个唯一参与者`,
            );
          } catch (error) {
            this.logger.warn(
              `获取会议参与者失败: ${meeting_info.meeting_id}, 错误: ${error.message}`,
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
              participants: uniqueParticipants.map(p => p.user_name),
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
            } catch (error) {
              this.logger.warn(
                `更新用户记录失败: ${participant.user_name} (${participant.uuid}), 错误: ${error.message}`,
              );
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
