import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BitableService } from '../bitable.service';
import { CreateRecordResponse, UpdateRecordResponse, BitableField, SearchFilter } from '../lark.types';

interface MeetingUserData {
    uuid: string;
    userid?: string;
    user_name?: string;
    phone_hase?: string;
    is_enterprise_user?: boolean;
}

interface UpdateMeetingUserData {
    userid?: string;
    user_name?: string;
    phone_hase?: string;
    is_enterprise_user?: boolean;
}

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
        private readonly configService: ConfigService
    ) {
        this.appToken = this.configService.get<string>('LARK_BITABLE_APP_TOKEN')!;
        this.tableId = this.configService.get<string>('LARK_BITABLE_MEETING_USER_TABLE_ID')!;
        
        if (!this.appToken || !this.tableId) {
            throw new Error('LARK_BITABLE_APP_TOKEN and LARK_BITABLE_MEETING_USER_TABLE_ID must be configured in environment variables');
        }
    }

    /**
     * Create a user record in Bitable (without checking for duplicates)
     * This method will always create a new record
     */
    async createMeetingUserRecord(userData: MeetingUserData): Promise<CreateRecordResponse> {
        const fields: BitableField = {
            uuid: userData.uuid,
            ...(userData.userid && { userid: userData.userid }),
            ...(userData.user_name && { user_name: userData.user_name }),
            ...(userData.phone_hase && { phone_hase: userData.phone_hase }),
            ...(userData.is_enterprise_user !== undefined && { is_enterprise_user: userData.is_enterprise_user }),
        };

        this.logger.log(`Creating new user record: ${userData.uuid}`);
        return this.bitableService.createRecord(this.appToken, this.tableId, fields);
    }

    /**
     * Create or update a user record in Bitable
     * If a record with the same uuid exists, update it
     * Otherwise, create a new record
     */
    async upsertMeetingUserRecord(userData: MeetingUserData): Promise<CreateRecordResponse | UpdateRecordResponse> {
        const fields: BitableField = {
            uuid: userData.uuid,
            ...(userData.userid && { userid: userData.userid }),
            ...(userData.user_name && { user_name: userData.user_name }),
            ...(userData.phone_hase && { phone_hase: userData.phone_hase }),
            ...(userData.is_enterprise_user !== undefined && { is_enterprise_user: userData.is_enterprise_user }),
        };

        // 构建查询条件：查找具有相同 uuid 的记录
        const searchConditions: Array<{
            field_name: string;
            operator: 'is';
            value: string[];
        }> = [
            {
                field_name: 'uuid',
                operator: 'is',
                value: [String(userData.uuid)]
            }
        ];

        const filter: SearchFilter = {
            conjunction: 'and',
            conditions: searchConditions
        };

        try {
            // 搜索是否存在相同记录
            const searchResult = await this.bitableService.searchRecords(this.appToken, this.tableId, { filter });
            
            if (searchResult.data?.items && searchResult.data.items.length > 0) {
                // 找到现有记录，进行更新
                const existingRecord = searchResult.data.items[0];
                this.logger.log(`Updating existing user record: ${userData.uuid}`);
                
                const updateResult = await this.bitableService.updateRecord(
                    this.appToken,
                    this.tableId,
                    existingRecord.record_id,
                    fields
                );
                
                // 将更新响应转换为与创建响应兼容的格式
                return {
                    code: updateResult.code,
                    msg: updateResult.msg,
                    data: updateResult.data
                };
            } else {
                // 没有现有记录，创建新记录
                this.logger.log(`Creating new user record: ${userData.uuid}`);
                return this.bitableService.createRecord(this.appToken, this.tableId, fields);
            }
        } catch (error) {
            this.logger.error(`Error in upsertUserRecord: ${error.message}`);
            throw error;
        }
    }

    /**
     * Search user records by uuid
     */
    async searchMeetingUserByUuid(uuid: string): Promise<any> {
        const searchConditions: Array<{
            field_name: string;
            operator: 'is';
            value: string[];
        }> = [
            {
                field_name: 'uuid',
                operator: 'is',
                value: [String(uuid)]
            }
        ];

        const filter: SearchFilter = {
            conjunction: 'and',
            conditions: searchConditions
        };

        try {
            this.logger.log(`Searching user by uuid: ${uuid}`);
            return await this.bitableService.searchRecords(this.appToken, this.tableId, { filter });
        } catch (error) {
            this.logger.error(`Error in searchUserByUuid: ${error.message}`);
            throw error;
        }
    }

    /**
     * Search user records by userid
     */
    async searchMeetingUserByUserid(userid: string): Promise<any> {
        const searchConditions: Array<{
            field_name: string;
            operator: 'is';
            value: string[];
        }> = [
            {
                field_name: 'userid',
                operator: 'is',
                value: [String(userid)]
            }
        ];

        const filter: SearchFilter = {
            conjunction: 'and',
            conditions: searchConditions
        };

        try {
            this.logger.log(`Searching user by userid: ${userid}`);
            return await this.bitableService.searchRecords(this.appToken, this.tableId, { filter });
        } catch (error) {
            this.logger.error(`Error in searchUserByUserid: ${error.message}`);
            throw error;
        }
    }

    /**
     * Search user records by user_name
     */
    async searchMeetingUserByuser_name(user_name: string): Promise<any> {
        const searchConditions: Array<{
            field_name: string;
            operator: 'is';
            value: string[];
        }> = [
            {
                field_name: 'user_name',
                operator: 'is',
                value: [String(user_name)]
            }
        ];

        const filter: SearchFilter = {
            conjunction: 'and',
            conditions: searchConditions
        };

        try {
            this.logger.log(`Searching user by user_name: ${user_name}`);
            return await this.bitableService.searchRecords(this.appToken, this.tableId, { filter });
        } catch (error) {
            this.logger.error(`Error in searchUserByuser_name: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update user record by uuid
     */
    async updateMeetingUserByUuid(uuid: string, updateData: UpdateMeetingUserData): Promise<UpdateRecordResponse> {
        const fields: BitableField = {
            ...(updateData.userid && { userid: updateData.userid }),
            ...(updateData.user_name && { user_name: updateData.user_name }),
            ...(updateData.phone_hase && { phone_hase: updateData.phone_hase }),
            ...(updateData.is_enterprise_user !== undefined && { is_enterprise_user: updateData.is_enterprise_user }),
        };

        // 首先查找用户记录
        const searchResult = await this.searchMeetingUserByUuid(uuid);
        
        if (searchResult.data?.items && searchResult.data.items.length > 0) {
            const existingRecord = searchResult.data.items[0];
            this.logger.log(`Updating user record: ${uuid}`);
            
            return await this.bitableService.updateRecord(
                this.appToken,
                this.tableId,
                existingRecord.record_id,
                fields
            );
        } else {
            throw new Error(`User with UUID ${uuid} not found`);
        }
    }

    /**
     * Search user records by is_enterprise_user
     */
    async searchMeetingUsersByEnterpriseStatus(isEnterpriseUser: boolean): Promise<any> {
        const searchConditions: Array<{
            field_name: string;
            operator: 'is';
            value: string[];
        }> = [
            {
                field_name: 'is_enterprise_user',
                operator: 'is',
                value: [String(isEnterpriseUser)]
            }
        ];

        const filter: SearchFilter = {
            conjunction: 'and',
            conditions: searchConditions
        };

        try {
            this.logger.log(`Searching users by enterprise status: ${isEnterpriseUser}`);
            return await this.bitableService.searchRecords(this.appToken, this.tableId, { filter });
        } catch (error) {
            this.logger.error(`Error in searchUsersByEnterpriseStatus: ${error.message}`);
            throw error;
        }
    }
}