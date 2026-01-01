import { Injectable, Logger } from '@nestjs/common';
import {
  ProcessingStatus,
  RecordingSource,
  RecordingStatus,
  MeetingType,
  MeetingPlatform,
  Prisma,
} from '@prisma/client';
import { MeetingRepository } from '../repositories/meeting.repository';
import { MeetingRecordingRepository } from '../repositories/meeting-recording.repository';
import { TencentApiService } from '../../integrations/tencent-meeting/api.service';
import {
  RecordMeeting,
  RecordFile,
} from '../../integrations/tencent-meeting/types';
import { SyncRecordingsResponseDto } from '../dto/sync-recordings.dto';
import { mergeTimestamp } from '../utils/date.util';

@Injectable()
export class TencentRecordingSyncService {
  private readonly logger = new Logger(TencentRecordingSyncService.name);

  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly meetingRecordingRepository: MeetingRecordingRepository,
    private readonly tencentApiService: TencentApiService,
  ) {}

  async syncTencentRecordings(
    startTime: number,
    endTime: number,
    pageSize: number = 10,
    operatorId?: string,
  ): Promise<SyncRecordingsResponseDto> {
    this.logger.log(
      `开始同步腾讯会议录制记录: startTime=${startTime}, endTime=${endTime}, pageSize=${pageSize}`,
    );

    const MAX_DAYS = 31;
    const SECONDS_PER_DAY = 86400;
    const MAX_SECONDS = MAX_DAYS * SECONDS_PER_DAY;

    let totalSyncedCount = 0;
    let totalCreatedCount = 0;
    let totalUpdatedCount = 0;
    let totalBatches = 0;

    try {
      const timeRange = endTime - startTime;

      if (timeRange > MAX_SECONDS) {
        this.logger.log(
          `时间范围超过${MAX_DAYS}天(${timeRange}秒)，将分批查询`,
        );

        let currentStartTime = startTime;
        let batchCount = 0;

        while (currentStartTime < endTime) {
          batchCount++;
          const currentEndTime = Math.min(
            currentStartTime + MAX_SECONDS,
            endTime,
          );

          this.logger.log(
            `正在处理第 ${batchCount} 批: ${currentStartTime} - ${currentEndTime}`,
          );

          const batchResult = await this.syncSingleBatch(
            currentStartTime,
            currentEndTime,
            pageSize,
            operatorId,
          );

          totalSyncedCount += batchResult.syncedCount;
          totalCreatedCount += batchResult.createdCount;
          totalUpdatedCount += batchResult.updatedCount;
          totalBatches++;

          this.logger.log(
            `第 ${batchCount} 批完成: 同步 ${batchResult.syncedCount} 条, 新增 ${batchResult.createdCount} 条, 更新 ${batchResult.updatedCount} 条`,
          );

          currentStartTime = currentEndTime;
        }
      } else {
        this.logger.log('时间范围在31天内，直接查询');
        const result = await this.syncSingleBatch(
          startTime,
          endTime,
          pageSize,
          operatorId,
        );
        totalSyncedCount = result.syncedCount;
        totalCreatedCount = result.createdCount;
        totalUpdatedCount = result.updatedCount;
        totalBatches = 1;
      }

      this.logger.log(
        `同步完成: 总共 ${totalSyncedCount} 条记录, 新增 ${totalCreatedCount} 条, 更新 ${totalUpdatedCount} 条, 共 ${totalBatches} 批`,
      );

      return {
        syncedCount: totalSyncedCount,
        createdCount: totalCreatedCount,
        updatedCount: totalUpdatedCount,
        totalPages: totalBatches,
        currentPage: totalBatches,
        pageSize,
        totalRecords: totalSyncedCount,
        syncedAt: new Date(),
      };
    } catch (error: unknown) {
      this.logger.error('同步腾讯会议录制记录失败', (error as Error).stack);
      throw error;
    }
  }

  private async syncSingleBatch(
    startTime: number,
    endTime: number,
    pageSize: number,
    operatorId?: string,
  ): Promise<{
    syncedCount: number;
    createdCount: number;
    updatedCount: number;
  }> {
    let currentPage = 1;
    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let totalPages = 1;

    while (true) {
      this.logger.log(
        `正在获取第 ${currentPage} 页数据 (时间范围: ${startTime} - ${endTime})...`,
      );

      const response = await this.tencentApiService.getCorpRecords(
        startTime,
        endTime,
        pageSize,
        currentPage,
        operatorId,
      );

      if (response.error_info) {
        throw new Error(
          `获取腾讯会议录制记录失败: ${response.error_info.message}`,
        );
      }

      totalPages = response.total_page;

      if (!response.record_meetings || response.record_meetings.length === 0) {
        this.logger.log('没有更多数据需要同步');
        break;
      }

      this.logger.log(
        `第 ${currentPage} 页获取到 ${response.record_meetings.length} 条记录`,
      );

      for (const recordMeeting of response.record_meetings) {
        const result = await this.syncSingleRecording(
          recordMeeting,
          operatorId,
        );
        syncedCount++;
        if (result.created) {
          createdCount++;
        } else {
          updatedCount++;
        }
      }

      if (currentPage >= totalPages) {
        this.logger.log(`已同步所有 ${totalPages} 页数据`);
        break;
      }

      currentPage++;
    }

    return {
      syncedCount,
      createdCount,
      updatedCount,
    };
  }

  private async syncSingleRecording(
    recordMeeting: RecordMeeting,
    operatorId?: string,
  ): Promise<{ created: boolean }> {
    const { meeting_id, record_files } = recordMeeting;

    let subMeetingId = '__ROOT__';

    try {
      this.logger.log(`获取会议详情: meeting_id=${meeting_id}`);

      const meetingDetail = await this.tencentApiService.getMeetingDetail(
        meeting_id,
        operatorId,
      );

      if (meetingDetail.error_info) {
        this.logger.warn(
          `获取会议详情失败: ${meetingDetail.error_info.message}，使用默认sub_meeting_id`,
        );
      } else {
        const meetingInfo = meetingDetail.meeting_info_list?.[0];
        const meetingType = meetingInfo?.meeting_type ?? 0;

        if (
          meetingType === 1 &&
          record_files &&
          record_files.length > 0 &&
          meetingInfo?.start_time
        ) {
          this.logger.log(
            `会议 ${meeting_id} 是周期性会议，计算sub_meeting_id`,
          );

          const firstRecordFile = record_files[0];
          const recordStartTime = firstRecordFile.record_start_time;
          subMeetingId = (
            mergeTimestamp(recordStartTime, meetingInfo.start_time) / 1000
          ).toString();
        } else {
          this.logger.log(
            `会议 ${meeting_id} 是普通会议，使用默认sub_meeting_id`,
          );
        }
      }
    } catch (error: unknown) {
      this.logger.warn(
        `获取会议详情时发生错误: ${(error as Error).message}，使用默认sub_meeting_id`,
      );
    }

    const meeting = await this.meetingRepository.upsertMeetingRecord(
      MeetingPlatform.TENCENT_MEETING,
      meeting_id,
      subMeetingId,
      {
        title: recordMeeting.subject || `会议 ${meeting_id}`,
        meetingCode: recordMeeting.meeting_code,
        startAt: new Date(recordMeeting.media_start_time),
        type: MeetingType.SCHEDULED,
        hasRecording: true,
        recordingStatus: ProcessingStatus.COMPLETED,
        processingStatus: ProcessingStatus.COMPLETED,
        metadata: {
          tencentMeeting: recordMeeting,
        } as unknown as Prisma.InputJsonValue,
      },
    );

    this.logger.log(
      `会议 ${meeting_id} (sub_meeting_id=${subMeetingId}) 已${meeting.createdAt === meeting.updatedAt ? '创建' : '更新'}`,
    );

    if (record_files && record_files.length > 0) {
      for (const recordFile of record_files) {
        await this.syncRecordingFile(meeting.id, recordFile);
      }
    }

    return { created: true };
  }

  private async syncRecordingFile(
    meetingId: string,
    recordFile: RecordFile,
  ): Promise<void> {
    const { record_file_id, record_start_time, record_end_time } = recordFile;

    await this.meetingRecordingRepository.upsertMeetingRecording({
      meetingId,
      externalId: record_file_id,
      source: RecordingSource.PLATFORM_AUTO,
      status: RecordingStatus.COMPLETED,
      startAt: new Date(record_start_time),
      endAt: new Date(record_end_time),
      metadata: {
        tencentMeeting: recordFile,
      } as unknown as Prisma.InputJsonValue,
    });
  }
}
