/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-27
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-31 12:00:05
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/events/smart-transcripts.handler.ts
 * @Description: 录制转写生成事件处理器
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from '../base/base-event.handler';
import { TencentEventPayload } from '../../types';
import { TranscriptService } from '../../services/transcript.service';
import { MeetingParticipantService } from '../../services/meeting-participant.service';
import { TranscriptBatchProcessor } from '../../services/transcript-batch-processor.service';
import { PrismaService } from '@/prisma/prisma.service';
import { TranscriptRepository } from '../../repositories/transcript.repository';
import { TencentMeetingRepository } from '../../repositories/tencent-meeting.repository';
import { RecordingTranscriptResponse } from '@/integrations/tencent-meeting/types';
import { Prisma } from '@prisma/client';
import { MeetingParticipantDetail } from '@/integrations/tencent-meeting/types';

/**
 * 录制转写生成事件处理器
 */
@Injectable()
export class SmartTranscriptsHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'smart.transcripts';

  constructor(
    private readonly transcriptService: TranscriptService,
    private readonly participantService: MeetingParticipantService,
    private readonly prisma: PrismaService,
    private readonly transcriptRepository: TranscriptRepository,
    private readonly tencentMeetingRepository: TencentMeetingRepository,
    private readonly batchProcessor: TranscriptBatchProcessor,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    const { meeting_info, recording_files = [] } = payload;

    if (!meeting_info) {
      this.logger.warn('Missing required meeting_info in payload');
      return;
    }

    const { meeting_id, sub_meeting_id } = meeting_info;
    const creatorUserId = meeting_info.creator.userid || '';

    try {
      for (const file of recording_files) {
        const fileId = file.record_file_id;

        this.logger.log(`开始处理转写文件: ${fileId}`, {
          fileId,
          meetingId: meeting_id,
        });

        const [transcriptResult, participants] = await Promise.all([
          this.transcriptService.getTranscript(fileId, creatorUserId),
          this.participantService.getUniqueParticipants(
            meeting_id,
            creatorUserId,
            sub_meeting_id,
          ),
        ]);

        if (!transcriptResult.transcriptResponse) {
          this.logger.warn(`转写数据为空，跳过处理: ${fileId}`);
          continue;
        }

        await this.saveTranscriptToDatabase(
          fileId,
          transcriptResult.transcriptResponse,
          participants,
          meeting_id,
          sub_meeting_id,
        );

        this.logger.log(`转写记录保存成功: ${fileId}`);
      }
    } catch (error: unknown) {
      this.logger.error(
        `处理转写事件失败: ${meeting_id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async saveTranscriptToDatabase(
    recordFileId: string,
    transcriptResponse: RecordingTranscriptResponse,
    participants: MeetingParticipantDetail[],
    meetingId: string,
    subMeetingId?: string,
  ): Promise<void> {
    const paragraphs = transcriptResponse.minutes?.paragraphs || [];

    if (paragraphs.length === 0) {
      this.logger.warn(`转写内容为空: ${recordFileId}`);
      return;
    }

    const { transcriptId, exists } = await this.prisma.$transaction(
      async (tx) => {
        const recordingId =
          await this.tencentMeetingRepository.findOrCreateRecordingByFileId(
            tx,
            recordFileId,
            meetingId,
            subMeetingId,
          );

        const existingTranscript =
          await this.transcriptRepository.findByRecordingId(recordingId);

        if (existingTranscript) {
          return {
            transcriptId: existingTranscript.id,
            recordingId,
            exists: true,
          };
        }

        const transcript = await this.transcriptRepository.create(tx, {
          source: `tencent-meeting:${recordFileId}`,
          rawJson: transcriptResponse as unknown as Prisma.InputJsonValue,
          status: 2,
          recordingId: recordingId,
        });

        return {
          transcriptId: transcript.id,
          recordingId,
          exists: false,
        };
      },
    );

    if (exists) {
      this.logger.log(`转写记录已存在，跳过处理: ${recordFileId}`);
      return;
    }

    await this.batchProcessor.processParagraphsInBatches(
      paragraphs,
      transcriptId,
      participants,
    );
  }
}
