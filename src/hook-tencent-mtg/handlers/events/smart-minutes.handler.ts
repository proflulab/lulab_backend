/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-30 00:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-31 12:02:26
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/events/smart-minutes.handler.ts
 * @Description: 智能纪要完成事件处理器
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from '../base/base-event.handler';
import { TencentEventPayload } from '../../types';
import { RecordingContentService } from '../../services/recording-content.service';
import { TencentMeetingRepository } from '../../repositories/tencent-meeting.repository';
import { MeetingSummaryRepository } from '../../repositories/meeting-summary.repository';
import {
  RecordingSource,
  RecordingStatus,
  GenerationMethod,
  ProcessingStatus,
  MeetingPlatform,
} from '@prisma/client';

/**
 * 智能纪要完成事件处理器
 */
@Injectable()
export class SmartMinutesHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'smart.minutes';

  constructor(
    private readonly recordingContentService: RecordingContentService,
    private readonly tencentMeetingRepository: TencentMeetingRepository,
    private readonly meetingSummaryRepository: MeetingSummaryRepository,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    const { meeting_info, recording_files = [] } = payload;

    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    if (!meeting_info) {
      this.logger.warn('Missing required meeting_info in payload');
      return;
    }

    const { meeting_id, sub_meeting_id } = meeting_info;
    const creatorUserId = meeting_info.creator.userid || '';

    for (const file of recording_files) {
      const recordFileId = file.record_file_id;

      try {
        await this.processRecordingFile(
          recordFileId,
          meeting_id,
          sub_meeting_id || '__ROOT__',
          creatorUserId,
        );
      } catch (error: unknown) {
        this.logger.error(
          `处理智能纪要失败: ${recordFileId}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  private async processRecordingFile(
    recordFileId: string,
    meetingId: string,
    subMeetingId: string,
    userId: string,
  ): Promise<void> {
    const startTime = Date.now();

    this.logger.log(`开始处理录制文件: ${recordFileId}`);

    const meeting = await this.tencentMeetingRepository.findMeeting(
      MeetingPlatform.TENCENT_MEETING,
      meetingId,
      subMeetingId,
    );

    if (!meeting) {
      this.logger.warn(`未找到会议记录: ${meetingId}`);
      return;
    }

    const recording =
      await this.tencentMeetingRepository.upsertMeetingRecording({
        meetingId: meeting.id,
        externalId: recordFileId,
        source: RecordingSource.PLATFORM_AUTO,
        status: RecordingStatus.COMPLETED,
        startAt: meeting.startAt || undefined,
        endAt: meeting.endAt || undefined,
      });

    this.logger.log(`录制记录已创建/更新: ${recording.id}`);

    const { minutes, todo } =
      await this.recordingContentService.fetchMeetingMinutes(
        recordFileId,
        userId,
      );

    const processingTime = Date.now() - startTime;

    await this.meetingSummaryRepository.upsertMeetingSummary({
      meetingId: meeting.id,
      recordingId: recording.id,
      aiMinutes: minutes ? { content: minutes } : undefined,
      actionItems: todo ? { items: todo } : undefined,
      generatedBy: GenerationMethod.AI,
      aiModel: 'tencent-meeting-ai',
      status: ProcessingStatus.COMPLETED,
      processingTime,
      language: 'zh-CN',
      version: 1,
      isLatest: true,
    });

    this.logger.log(
      `智能纪要处理完成: ${recordFileId}, 耗时: ${processingTime}ms`,
    );
  }
}
