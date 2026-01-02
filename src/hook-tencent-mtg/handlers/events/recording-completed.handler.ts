/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-13 02:54:40
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-02 11:01:14
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/events/recording-completed.handler.ts
 * @Description: 录制完成事件处理器
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from '../base/base-event.handler';
import {
  RecordingProcessorService,
  ParticipantSummaryService,
} from '../../services';
import { RecordingCompletedPayload } from '../../types';
import { MeetingBitableService } from '../../services/meeting-bitable.service';
import { NumberRecordBitableRepository } from '@/integrations/lark/repositories';
import { TencentMeetingRepository } from '../../repositories/tencent-meeting.repository';
import { MeetingRecordingRepository } from '../../repositories/meeting-recording.repository';
import { ParticipantSummaryRepository } from '../../repositories/participant-summary.repository';
import { MeetingSummaryRepository } from '../../repositories/meeting-summary.repository';
import { TranscriptBatchProcessor } from '../../services/transcript-batch-processor.service';
import { TranscriptRepository } from '../../repositories/transcript.repository';
import { PlatformUserRepository } from '@/user-platform/repositories/platform-user.repository';
import {
  Prisma,
  RecordingSource,
  RecordingStatus,
  GenerationMethod,
  ProcessingStatus,
  MeetingPlatform,
} from '@prisma/client';

/**
 * 录制完成事件处理器
 */

@Injectable()
export class RecordingCompletedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'recording.completed';

  constructor(
    private readonly numberRecordBitable: NumberRecordBitableRepository,
    private readonly recordingProcessorService: RecordingProcessorService,
    private readonly participantSummaryService: ParticipantSummaryService,
    private readonly bitableService: MeetingBitableService,
    private readonly tencentMeetingRepository: TencentMeetingRepository,
    private readonly meetingRecordingRepository: MeetingRecordingRepository,
    private readonly participantSummaryRepository: ParticipantSummaryRepository,
    private readonly meetingSummaryRepository: MeetingSummaryRepository,
    private readonly transcriptRepository: TranscriptRepository,
    private readonly batchProcessor: TranscriptBatchProcessor,
    private readonly platformUserRepository: PlatformUserRepository,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(
    payload: RecordingCompletedPayload,
    index: number,
  ): Promise<void> {
    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    const { meeting_info, recording_files = [] } = payload;
    const { meeting_id, sub_meeting_id } = meeting_info;
    const creatorUserId = meeting_info.creator.userid || '';

    const aggregate = await this.recordingProcessorService.processRecordings(
      meeting_id,
      creatorUserId,
      recording_files,
      sub_meeting_id,
    );

    await Promise.allSettled(
      aggregate.uniqueParticipants.map((participant) =>
        this.platformUserRepository.upsertPlatformUser(
          {
            platform: MeetingPlatform.TENCENT_MEETING,
            platformUuid: participant.uuid,
          },
          {
            platformUserId: participant.userid,
            userName: participant.user_name,
            phone: participant.phone,
          },
          {
            userName: participant.user_name,
            phone: participant.phone,
            lastSeenAt: new Date(),
          },
        ),
      ),
    );

    for (const recording of aggregate.recordings) {
      const result =
        await this.participantSummaryService.generateParticipantSummaries(
          meeting_info,
          recording,
        );

      const meeting = await this.tencentMeetingRepository.findMeeting(
        MeetingPlatform.TENCENT_MEETING,
        meeting_id,
        sub_meeting_id || '__ROOT__',
      );

      if (!meeting) {
        this.logger.error(`未找到会议: ${meeting_id}`);
        continue;
      }

      const record =
        await this.meetingRecordingRepository.upsertMeetingRecording({
          meetingId: meeting.id,
          externalId: recording.fileId,
          source: RecordingSource.PLATFORM_AUTO,
          status: RecordingStatus.COMPLETED,
          startAt: meeting.startAt || undefined,
          endAt: meeting.endAt || undefined,
        });

      await this.meetingSummaryRepository.upsertMeetingSummary({
        meetingId: meeting.id,
        recordingId: record.id,
        content: recording.fullsummary,
        aiMinutes: recording.ai_minutes
          ? { content: recording.ai_minutes }
          : undefined,
        actionItems: recording.todo ? { items: recording.todo } : undefined,
        generatedBy: GenerationMethod.AI,
        aiModel: 'tencent-meeting-ai',
        status: ProcessingStatus.COMPLETED,
        language: 'zh-CN',
        version: 1,
        isLatest: true,
      });

      let existingTranscript =
        await this.transcriptRepository.findByRecordingId(record.id);

      if (!existingTranscript && recording.transcriptResponse) {
        existingTranscript = await this.transcriptRepository.createDirect({
          source: `tencent-meeting:`,
          rawJson:
            recording.transcriptResponse as unknown as Prisma.InputJsonValue,
          status: 2,
          recordingId: record.id,
        });

        await this.batchProcessor.processParagraphsInBatches(
          recording.transcriptResponse.minutes?.paragraphs || [],
          existingTranscript.id,
          aggregate.uniqueParticipants,
        );
      }

      const matchedUuids = recording.matchedParticipants.map((p) => p.uuid);

      const platformUserMap =
        await this.platformUserRepository.findPlatformUsersByPlatformAndUuids(
          MeetingPlatform.TENCENT_MEETING,
          matchedUuids,
        );

      const participantSummariesData = await Promise.all(
        result.success.map(async (item) => {
          let platformUser = platformUserMap.get(item.uuid);
          return {
            periodType: 'SINGLE' as const,
            platformUserId: platformUser?.id || '',
            meetingId: meeting.id,
            meetingRecordingId: record.id,
            userName: item.user_name,
            partSummary: item.participantSummary,
            generatedBy: GenerationMethod.AI,
            aiModel: 'deepseek',
            version: 1,
            isLatest: true,
          };
        }),
      );

      await this.participantSummaryRepository.createMany(
        participantSummariesData,
      );

      // // 创建会议记录和录制文件记录
      const recordingRecordId =
        await this.bitableService.upsertRecordingFileRecord(
          recording.fileId,
          meeting_info,
          recording.fullsummary,
          recording.todo,
          recording.ai_minutes,
          recording.uniqueUsernames.join(','),
          recording.formattedTranscript,
        );

      for (const u of result.success) {
        const participant = aggregate.uniqueParticipants.find(
          (p) => p.uuid === u.uuid,
        );

        if (!participant) {
          this.logger.error(`未找到匹配的参会者: ${u.uuid}`);
          continue;
        }

        const uId =
          await this.bitableService.safeUpsertMeetingUserRecord(participant);

        // 保存参会者总结到number_record表，填入记录id
        await this.numberRecordBitable.upsertNumberRecord({
          meet_participant: [uId],
          participant_summary: u.participantSummary,
          record_file: [recordingRecordId ?? ''],
        });
      }

      this.logger.log(
        `生成参会者总结: 成功 ${result.success.length} 个, 失败 ${result.failed.length} 个`,
      );
    }
  }
}
