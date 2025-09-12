import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BitableService } from '../bitable.service';
import {
  CreateRecordResponse,
  UpdateRecordResponse,
  BitableField,
} from '../lark.types';

interface MeetingData {
  platform: string;
  subject: string;
  meeting_id: string;
  sub_meeting_id?: string;
  meeting_code?: string;
  start_time?: number;
  end_time?: number;
  operator?: string[];
  creator?: string[];
}

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
    private readonly configService: ConfigService,
  ) {
    this.appToken = this.configService.get<string>('LARK_BITABLE_APP_TOKEN')!;
    this.tableId = this.configService.get<string>(
      'LARK_BITABLE_MEETING_TABLE_ID',
    )!;

    if (!this.appToken || !this.tableId) {
      throw new Error(
        'LARK_BITABLE_APP_TOKEN and LARK_BITABLE_MEETING_TABLE_ID must be configured in environment variables',
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
      this.logger.error(`Error in upsertMeetingRecord: ${error.message}`);
      throw error;
    }
  }
}
