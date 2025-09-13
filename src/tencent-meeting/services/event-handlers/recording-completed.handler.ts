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
} from '@libs/integrations-lark/repositories';

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

    let meetingRecordId;

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
    } catch (error) {
      this.logger.error(
        `处理录制完成事件失败: ${meeting_info.meeting_id}`,
        error,
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
          const recordingResult =
            await this.recordingFileBitable.upsertRecordingFileRecord({
              record_file_id: file.record_file_id,
              meet: [meetingRecordId],
              start_time: meeting_info.start_time * 1000,
              end_time: meeting_info.end_time * 1000,
            });

          if (recordingResult.data?.record) {
            this.logger.log(
              `录制文件记录已创建/更新: ${file.record_file_id} (记录ID: ${recordingResult.data.record.record_id})`,
            );
          }
        } catch (error) {
          this.logger.error(`处理录制文件失败: ${file.record_file_id}`, error);
          // 不抛出错误，避免影响主流程
        }
      }
    } else {
      this.logger.log(`该会议没有录制文件 [${index}]: ${meeting_info.subject}`);
    }
  }
}
