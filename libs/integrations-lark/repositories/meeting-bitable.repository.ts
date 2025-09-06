import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BitableService } from '../bitable.service';
import { CreateRecordResponse, UpdateRecordResponse, BitableField, SearchFilter } from '../lark.types';

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
        private readonly configService: ConfigService
    ) {
        this.appToken = this.configService.get<string>('LARK_BITABLE_APP_TOKEN')!;
        this.tableId = this.configService.get<string>('LARK_BITABLE_MEETING_TABLE_ID')!;
        
        if (!this.appToken || !this.tableId) {
            throw new Error('LARK_BITABLE_APP_TOKEN and LARK_BITABLE_MEETING_TABLE_ID must be configured in environment variables');
        }
    }

    /**
     * Create a meeting record in Bitable (without checking for duplicates)
     * This method will always create a new record
     */
    async createMeetingRecord(meetingData: MeetingData): Promise<CreateRecordResponse> {
        const fields: BitableField = {
            platform: meetingData.platform,
            subject: meetingData.subject,
            meeting_id: meetingData.meeting_id,
            ...(meetingData.sub_meeting_id && { sub_meeting_id: meetingData.sub_meeting_id }),
            ...(meetingData.meeting_code && { meeting_code: meetingData.meeting_code }),
            ...(meetingData.start_time && { start_time: meetingData.start_time }),
            ...(meetingData.end_time && { end_time: meetingData.end_time }),
            ...(meetingData.operator && { operator: meetingData.operator }),
            ...(meetingData.creator && { creator: meetingData.creator }),
        };

        this.logger.log(`Creating new meeting record: ${meetingData.meeting_id} (sub_meeting_id: ${meetingData.sub_meeting_id || 'none'})`);
        return this.bitableService.createRecord(this.appToken, this.tableId, fields);
    }

    /**
     * Create or update a meeting record in Bitable
     * If a record with the same meeting_id and sub_meeting_id combination exists, update it
     * Otherwise, create a new record
     */
    async upsertMeetingRecord(meetingData: MeetingData): Promise<CreateRecordResponse | UpdateRecordResponse> {
        const fields: BitableField = {
            platform: meetingData.platform,
            subject: meetingData.subject,
            meeting_id: meetingData.meeting_id,
            ...(meetingData.sub_meeting_id && { sub_meeting_id: meetingData.sub_meeting_id }),
            ...(meetingData.meeting_code && { meeting_code: meetingData.meeting_code }),
            ...(meetingData.start_time && { start_time: meetingData.start_time }),
            ...(meetingData.end_time && { end_time: meetingData.end_time }),
            ...(meetingData.operator && { operator: meetingData.operator }),
            ...(meetingData.creator && { creator: meetingData.creator }),
        };

        // 构建查询条件：查找具有相同 meeting_id 和 sub_meeting_id 的记录
        const searchConditions: Array<{
            field_name: string;
            operator: 'is' | 'isEmpty' | 'isNotEmpty';
            value?: string[];
        }> = [
            {
                field_name: 'meeting_id',
                operator: 'is',
                value: [String(meetingData.meeting_id)]
            }
        ];

        // 如果有 sub_meeting_id，添加到查询条件
        if (meetingData.sub_meeting_id) {
            searchConditions.push({
                field_name: 'sub_meeting_id',
                operator: 'is',
                value: [String(meetingData.sub_meeting_id)]
            });
        } else {
            // 如果没有 sub_meeting_id，确保查询的记录也没有 sub_meeting_id
            // 注意：isEmpty操作符不需要value参数
            searchConditions.push({
                field_name: 'sub_meeting_id',
                operator: 'isEmpty',
                value: []
            });
        }

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
                this.logger.log(`Updating existing meeting record: ${meetingData.meeting_id} (sub_meeting_id: ${meetingData.sub_meeting_id || 'none'})`);
                
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
                this.logger.log(`Creating new meeting record: ${meetingData.meeting_id} (sub_meeting_id: ${meetingData.sub_meeting_id || 'none'})`);
                return this.bitableService.createRecord(this.appToken, this.tableId, fields);
            }
        } catch (error) {
            this.logger.error(`Error in createMeetingRecord: ${error.message}`);
            throw error;
        }
    }

}