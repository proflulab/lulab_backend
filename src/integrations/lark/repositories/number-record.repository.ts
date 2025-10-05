import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { BitableService } from '../services/bitable.service';
import {
  CreateRecordResponse,
  UpdateRecordResponse,
  BitableField,
  SearchFilter,
} from '../types/lark-bitable.types';
import { larkConfig } from '../../../configs/lark.config';
import { NumberRecordData, UpdateNumberRecordData } from '../types';

/**
 * Repository layer for Number Record Bitable operations
 * This provides a data access abstraction for participant meeting summary related business use cases
 */
@Injectable()
export class NumberRecordBitableRepository {
  private readonly logger = new Logger(NumberRecordBitableRepository.name);
  private readonly appToken: string;
  private readonly tableId: string;

  constructor(
    private readonly bitableService: BitableService,
    @Inject(larkConfig.KEY) private readonly cfg: ConfigType<typeof larkConfig>,
  ) {
    this.appToken = this.cfg.bitable.appToken;
    this.tableId = this.cfg.bitable.tableIds.numberRecord;

    if (!this.appToken || !this.tableId) {
      throw new Error(
        'LARK_BITABLE_APP_TOKEN and LARK_TABLE_NUMBER_RECORD must be configured in environment variables',
      );
    }
  }

  /**
   * Create a number record in Bitable (without checking for duplicates)
   * This method will always create a new record
   */
  async createNumberRecord(
    recordData: NumberRecordData,
  ): Promise<CreateRecordResponse> {
    const fields: BitableField = {
      meet_participant: recordData.meet_participant,
      participant_summary: recordData.participant_summary,
      meet_data: recordData.meet_data,
    };

    this.logger.log(
      `Creating new number record with participants: ${recordData.meet_participant.join(', ')}`,
    );
    return this.bitableService.createRecord(
      this.appToken,
      this.tableId,
      fields,
    );
  }

  /**
   * Create or update a number record in Bitable
   * If a record with the same meet_participant exists, update it
   * Otherwise, create a new record
   */
  async upsertNumberRecord(
    recordData: NumberRecordData,
  ): Promise<CreateRecordResponse | UpdateRecordResponse> {
    const fields: BitableField = {
      meet_participant: recordData.meet_participant,
      participant_summary: recordData.participant_summary,
      meet_data: recordData.meet_data,
    };

    try {
      // 使用通用的 upsertRecord 方法
      const result = await this.bitableService.upsertRecord(
        this.appToken,
        this.tableId,
        fields,
        {
          matchFields: ['meet_participant'],
          matchMode: 'partial',
          caseSensitive: false,
        },
        {
          mergeFields: false,
          returnFullRecord: true,
        },
      );

      this.logger.log(
        `${result.action === 'created' ? 'Creating' : 'Updating'} number record with participants: ${recordData.meet_participant.join(', ')}`,
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
      this.logger.error(`Error in upsertNumberRecord: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Search number records by meet_participant
   */
  async searchNumberRecordByParticipants(
    participants: string[],
  ): Promise<unknown> {
    const searchConditions: Array<{
      field_name: string;
      operator: 'is';
      value: string[];
    }> = [
      {
        field_name: 'meet_participant',
        operator: 'is',
        value: participants,
      },
    ];

    const filter: SearchFilter = {
      conjunction: 'and',
      conditions: searchConditions,
    };

    try {
      this.logger.log(
        `Searching number record by participants: ${participants.join(', ')}`,
      );
      return await this.bitableService.searchRecords(
        this.appToken,
        this.tableId,
        { filter },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in searchNumberRecordByParticipants: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Update number record by record ID
   */
  async updateNumberRecordById(
    recordId: string,
    updateData: UpdateNumberRecordData,
  ): Promise<UpdateRecordResponse> {
    const fields: BitableField = {
      ...(updateData.meet_participant && {
        meet_participant: updateData.meet_participant,
      }),
      ...(updateData.participant_summary && {
        participant_summary: updateData.participant_summary,
      }),
      ...(updateData.meet_data && { meet_data: updateData.meet_data }),
    };

    try {
      this.logger.log(`Updating number record: ${recordId}`);
      return await this.bitableService.updateRecord(
        this.appToken,
        this.tableId,
        recordId,
        fields,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in updateNumberRecordById: ${errorMessage}`);
      throw error;
    }
  }
}
