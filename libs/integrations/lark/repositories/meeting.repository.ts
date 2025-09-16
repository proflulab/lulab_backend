import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { BitableService } from '../services/bitable.service';
import {
  CreateRecordResponse,
  UpdateRecordResponse,
  BitableField,
} from '../types/lark.types';
import { larkConfig } from '../config/lark.config';
import { MeetingData } from '../types';

/**
 * Repository for meeting-related Bitable operations
 * Provides data access abstraction for meeting record management
 */
@Injectable()
export class MeetingBitableRepository {
  private readonly logger = new Logger(MeetingBitableRepository.name);
  private readonly appToken: string;
  private readonly tableId: string;

  constructor(
    private readonly bitableService: BitableService,
    @Inject(larkConfig.KEY) private readonly cfg: ConfigType<typeof larkConfig>,
  ) {
    this.appToken = this.cfg.bitable.appToken;
    this.tableId = this.cfg.bitable.tableIds.meeting;

    if (!this.appToken || !this.tableId) {
      throw new Error(
        'LARK_BITABLE_APP_TOKEN and LARK_TABLE_MEETING must be configured in environment variables',
      );
    }
  }

  /**
   * Create a meeting record in Bitable (without checking for duplicates)
   * This method will always create a new record
   */
  async createMeetingRecord(
    meetingData: MeetingData,
  ): Promise<CreateRecordResponse> {
    const fields: BitableField = {
      platform: meetingData.platform,
      subject: meetingData.subject,
      meeting_id: meetingData.meeting_id,
      ...(meetingData.sub_meeting_id && {
        sub_meeting_id: meetingData.sub_meeting_id,
      }),
      ...(meetingData.meeting_code && {
        meeting_code: meetingData.meeting_code,
      }),
      ...(meetingData.start_time && { start_time: meetingData.start_time }),
      ...(meetingData.end_time && { end_time: meetingData.end_time }),
      ...(meetingData.operator && { operator: meetingData.operator }),
      ...(meetingData.creator && { creator: meetingData.creator }),
    };

    this.logger.log(
      `Creating new meeting record: ${meetingData.meeting_id} (sub_meeting_id: ${meetingData.sub_meeting_id || 'none'})`,
    );
    return this.bitableService.createRecord(
      this.appToken,
      this.tableId,
      fields,
    );
  }

  /**
   * Create or update a meeting record in Bitable
   * If a record with the same meeting_id and sub_meeting_id combination exists, update it
   * Otherwise, create a new record
   */
  async upsertMeetingRecord(
    meetingData: MeetingData,
  ): Promise<CreateRecordResponse | UpdateRecordResponse> {
    const fields: BitableField = {
      platform: meetingData.platform,
      subject: meetingData.subject,
      meeting_id: meetingData.meeting_id,
      ...(meetingData.sub_meeting_id && {
        sub_meeting_id: meetingData.sub_meeting_id,
      }),
      ...(meetingData.meeting_code && {
        meeting_code: meetingData.meeting_code,
      }),
      ...(meetingData.start_time && { start_time: meetingData.start_time }),
      ...(meetingData.end_time && { end_time: meetingData.end_time }),
      ...(meetingData.operator && { operator: meetingData.operator }),
      ...(meetingData.creator && { creator: meetingData.creator }),
    };

    // 构建匹配字段数组 - 根据是否有 sub_meeting_id 决定匹配字段
    const matchFields = meetingData.sub_meeting_id
      ? ['meeting_id', 'sub_meeting_id']
      : ['meeting_id'];

    try {
      // 使用通用的 upsertRecord 方法
      const result = await this.bitableService.upsertRecord(
        this.appToken,
        this.tableId,
        fields,
        {
          matchFields,
          matchMode: 'exact',
          caseSensitive: false,
        },
        {
          mergeFields: false,
          returnFullRecord: true,
        },
      );

      this.logger.log(
        `${result.action === 'created' ? 'Creating' : 'Updating'} meeting record: ${meetingData.meeting_id} (sub_meeting_id: ${meetingData.sub_meeting_id || 'none'})`,
      );

      // 构建与原有接口兼容的响应
      const response: CreateRecordResponse | UpdateRecordResponse = {
        code: 0,
        msg: 'success',
        data: {
          record: result.record,
        },
      };

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in upsertMeetingRecord: ${errorMessage}`);
      throw error;
    }
  }
}
