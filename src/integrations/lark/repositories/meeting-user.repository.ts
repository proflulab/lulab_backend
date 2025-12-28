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
import { MeetingUserData, UpdateMeetingUserData } from '../types';

/**
 * Repository layer for User Bitable operations
 * This provides a data access abstraction for user-related business use cases
 */
@Injectable()
export class MeetingUserBitableRepository {
  private readonly logger = new Logger(MeetingUserBitableRepository.name);
  private readonly appToken: string;
  private readonly tableId: string;

  constructor(
    private readonly bitableService: BitableService,
    @Inject(larkConfig.KEY) private readonly cfg: ConfigType<typeof larkConfig>,
  ) {
    this.appToken = this.cfg.bitable.appToken;
    this.tableId = this.cfg.bitable.tableIds.meetingUser;

    if (!this.appToken || !this.tableId) {
      throw new Error(
        'LARK_BITABLE_APP_TOKEN and LARK_TABLE_MEETING_USER must be configured in environment variables',
      );
    }
  }

  /**
   * Create a user record in Bitable (without checking for duplicates)
   * This method will always create a new record
   */
  async createMeetingUserRecord(
    userData: MeetingUserData,
  ): Promise<CreateRecordResponse> {
    const fields: BitableField = {
      uuid: userData.uuid,
      ...(userData.userid && { userid: userData.userid }),
      ...(userData.user_name && { user_name: userData.user_name }),
      ...(userData.phone_hase && { phone_hase: userData.phone_hase }),
      ...(userData.is_enterprise_user !== undefined && {
        is_enterprise_user: userData.is_enterprise_user,
      }),
      ...(userData.meet && { meet: userData.meet }),
      ...(userData.user && { user: userData.user }),
      ...(userData.meet_creator && { meet_creator: userData.meet_creator }),
    };

    this.logger.log(`Creating new user record: ${userData.uuid}`);
    return this.bitableService.createRecord(
      this.appToken,
      this.tableId,
      fields,
    );
  }

  /**
   * Create or update a user record in Bitable
   * If a record with the same uuid exists, update it
   * Otherwise, create a new record
   */
  async upsertMeetingUserRecord(
    userData: MeetingUserData,
  ): Promise<CreateRecordResponse | UpdateRecordResponse> {
    const fields: BitableField = {
      uuid: userData.uuid,
      ...(userData.userid && { userid: userData.userid }),
      ...(userData.user_name && { user_name: userData.user_name }),
      ...(userData.phone_hase && { phone_hase: userData.phone_hase }),
      ...(userData.is_enterprise_user !== undefined && {
        is_enterprise_user: userData.is_enterprise_user,
      }),
      ...(userData.meet && { meet: userData.meet }),
      ...(userData.user && { user: userData.user }),
      ...(userData.meet_creator && { meet_creator: userData.meet_creator }),
    };

    try {
      // 使用通用的 upsertRecord 方法
      const result = await this.bitableService.upsertRecord(
        this.appToken,
        this.tableId,
        fields,
        {
          matchFields: ['uuid'],
          matchMode: 'exact',
          caseSensitive: false,
        },
        {
          mergeFields: false,
          returnFullRecord: true,
        },
      );

      this.logger.log(
        `${result.action === 'created' ? 'Creating' : 'Updating'} user record: ${userData.uuid}`,
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
      this.logger.error(`Error in upsertMeetingUserRecord: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Search user records by uuid
   */
  async searchMeetingUserByUuid(uuid: string): Promise<unknown> {
    const searchConditions: Array<{
      field_name: string;
      operator: 'is';
      value: string[];
    }> = [
      {
        field_name: 'uuid',
        operator: 'is',
        value: [String(uuid)],
      },
    ];

    const filter: SearchFilter = {
      conjunction: 'and',
      conditions: searchConditions,
    };

    try {
      this.logger.log(`Searching user by uuid: ${uuid}`);
      return await this.bitableService.searchRecords(
        this.appToken,
        this.tableId,
        { filter },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in searchUserByUuid: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Search user records by userid
   */
  async searchMeetingUserByUserid(userid: string): Promise<unknown> {
    const searchConditions: Array<{
      field_name: string;
      operator: 'is';
      value: string[];
    }> = [
      {
        field_name: 'userid',
        operator: 'is',
        value: [String(userid)],
      },
    ];

    const filter: SearchFilter = {
      conjunction: 'and',
      conditions: searchConditions,
    };

    try {
      this.logger.log(`Searching user by userid: ${userid}`);
      return await this.bitableService.searchRecords(
        this.appToken,
        this.tableId,
        { filter },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in searchUserByUserid: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Search user records by user_name
   */
  async searchMeetingUserByuser_name(user_name: string): Promise<unknown> {
    const searchConditions: Array<{
      field_name: string;
      operator: 'is';
      value: string[];
    }> = [
      {
        field_name: 'user_name',
        operator: 'is',
        value: [String(user_name)],
      },
    ];

    const filter: SearchFilter = {
      conjunction: 'and',
      conditions: searchConditions,
    };

    try {
      this.logger.log(`Searching user by user_name: ${user_name}`);
      return await this.bitableService.searchRecords(
        this.appToken,
        this.tableId,
        { filter },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in searchUserByuser_name: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Update user record by uuid
   */
  async updateMeetingUserByUuid(
    uuid: string,
    updateData: UpdateMeetingUserData,
  ): Promise<UpdateRecordResponse> {
    const fields: BitableField = {
      ...(updateData.userid && { userid: updateData.userid }),
      ...(updateData.user_name && { user_name: updateData.user_name }),
      ...(updateData.phone_hase && { phone_hase: updateData.phone_hase }),
      ...(updateData.is_enterprise_user !== undefined && {
        is_enterprise_user: updateData.is_enterprise_user,
      }),
      ...(updateData.meet && { meet: updateData.meet }),
      ...(updateData.user && { user: updateData.user }),
      ...(updateData.meet_creator && { meet_creator: updateData.meet_creator }),
    };

    // 首先查找用户记录
    const searchResult = (await this.searchMeetingUserByUuid(uuid)) as {
      data?: { items?: Array<{ record_id: string }> };
    };

    if (searchResult.data?.items && searchResult.data.items.length > 0) {
      const existingRecord = searchResult.data.items[0];
      this.logger.log(`Updating user record: ${uuid}`);

      return await this.bitableService.updateRecord(
        this.appToken,
        this.tableId,
        existingRecord.record_id,
        fields,
      );
    } else {
      throw new Error(`User with UUID ${uuid} not found`);
    }
  }

  /**
   * Search user records by is_enterprise_user
   */
  async searchMeetingUsersByEnterpriseStatus(
    isEnterpriseUser: boolean,
  ): Promise<unknown> {
    const searchConditions: Array<{
      field_name: string;
      operator: 'is';
      value: string[];
    }> = [
      {
        field_name: 'is_enterprise_user',
        operator: 'is',
        value: [String(isEnterpriseUser)],
      },
    ];

    const filter: SearchFilter = {
      conjunction: 'and',
      conditions: searchConditions,
    };

    try {
      this.logger.log(
        `Searching users by enterprise status: ${isEnterpriseUser}`,
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
        `Error in searchUsersByEnterpriseStatus: ${errorMessage}`,
      );
      throw error;
    }
  }
}
