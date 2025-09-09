import { Injectable, Logger } from '@nestjs/common';
import { LarkClient } from './lark.client';
import {
    CreateRecordRequest,
    CreateRecordResponse,
    UpdateRecordRequest,
    UpdateRecordResponse,
    SearchRecordRequest,
    SearchRecordResponse,
    SearchRecordIteratorOptions,
    ListRecordRequest,
    ListRecordResponse,
    BitableField,
    SearchFilter,
    SearchSort,
    LarkRecord
} from './lark.types';

@Injectable()
export class BitableService {
    private readonly logger = new Logger(BitableService.name);

    constructor(private readonly larkClient: LarkClient) { }

    /**
     * Create a simple record with common field types
     */
    async createRecord(
        appToken: string,
        tableId: string,
        fields: BitableField
    ): Promise<CreateRecordResponse> {
        const request: CreateRecordRequest = {
            app_token: appToken,
            table_id: tableId,
            fields,
        };

        return this.larkClient.createBitableRecord(request);
    }

    /**
     * Update an existing record
     */
    async updateRecord(
        appToken: string,
        tableId: string,
        recordId: string,
        fields: BitableField
    ): Promise<UpdateRecordResponse> {
        const request: UpdateRecordRequest = {
            app_token: appToken,
            table_id: tableId,
            record_id: recordId,
            fields,
        };

        return this.larkClient.updateBitableRecord(request);
    }

    /**
     * Search records with advanced filtering and sorting
     */
    async searchRecords(
        appToken: string,
        tableId: string,
        options?: {
            viewId?: string;
            fieldNames?: string[];
            sort?: SearchSort[];
            filter?: SearchFilter;
            pageSize?: number;
            pageToken?: string;
            automaticFields?: boolean;
        }
    ): Promise<SearchRecordResponse> {
        const request: SearchRecordRequest = {
            app_token: appToken,
            table_id: tableId,
            ...(options?.viewId && { view_id: options.viewId }),
            ...(options?.fieldNames && { field_names: options.fieldNames }),
            ...(options?.sort && { sort: options.sort }),
            ...(options?.filter && { filter: options.filter }),
            ...(options?.pageSize && { page_size: options.pageSize }),
            ...(options?.pageToken && { page_token: options.pageToken }),
            ...(options?.automaticFields !== undefined && { automatic_fields: options.automaticFields }),
        };

        return this.larkClient.searchBitableRecords(request);
    }

    /**
     * Search records with iterator for handling large datasets
     */
    async *searchRecordsIterator(
        appToken: string,
        tableId: string,
        options?: {
            viewId?: string;
            fieldNames?: string[];
            sort?: SearchSort[];
            filter?: SearchFilter;
            pageSize?: number;
            userIdType?: 'user_id' | 'union_id' | 'open_id';
        }
    ): AsyncGenerator<LarkRecord, void, unknown> {
        const iteratorOptions: SearchRecordIteratorOptions = {
            app_token: appToken,
            table_id: tableId,
            ...(options?.viewId && { view_id: options.viewId }),
            ...(options?.fieldNames && { field_names: options.fieldNames }),
            ...(options?.sort && { sort: options.sort }),
            ...(options?.filter && { filter: options.filter }),
            ...(options?.pageSize && { page_size: options.pageSize }),
            ...(options?.userIdType && { user_id_type: options.userIdType }),
        };

        yield* this.larkClient.searchBitableRecordsIterator(iteratorOptions);
    }

    /**
     * List records in a table
     */
    async listRecords(
        appToken: string,
        tableId: string,
        options?: {
            viewId?: string;
            fieldNames?: string;  // Note: List API expects comma-separated string
            filter?: string;
            sort?: string;        // Note: List API expects string format
            pageSize?: number;
            pageToken?: string;
            textFieldAsArray?: boolean;
            userIdType?: 'user_id' | 'union_id' | 'open_id';
            displayFormulaRef?: boolean;
            automaticFields?: boolean;
        }
    ): Promise<ListRecordResponse> {
        const request: ListRecordRequest = {
            app_token: appToken,
            table_id: tableId,
            ...(options?.viewId && { view_id: options.viewId }),
            ...(options?.fieldNames && { field_names: options.fieldNames }),
            ...(options?.filter && { filter: options.filter }),
            ...(options?.sort && { sort: options.sort }),
            ...(options?.pageSize && { page_size: options.pageSize }),
            ...(options?.pageToken && { page_token: options.pageToken }),
            ...(options?.textFieldAsArray !== undefined && { text_field_as_array: options.textFieldAsArray }),
            ...(options?.userIdType && { user_id_type: options.userIdType }),
            ...(options?.displayFormulaRef !== undefined && { display_formula_ref: options.displayFormulaRef }),
            ...(options?.automaticFields !== undefined && { automatic_fields: options.automaticFields }),
        };

        return this.larkClient.listBitableRecords(request);
    }

    /**
     * List records with iterator for handling large datasets
     */
    async *listRecordsIterator(
        appToken: string,
        tableId: string,
        options?: {
            viewId?: string;
            fieldNames?: string;  // Note: List API expects comma-separated string
            filter?: string;
            sort?: string;        // Note: List API expects string format
            pageSize?: number;
            textFieldAsArray?: boolean;
            userIdType?: 'user_id' | 'union_id' | 'open_id';
            displayFormulaRef?: boolean;
            automaticFields?: boolean;
        }
    ): AsyncGenerator<LarkRecord, void, unknown> {
        const request: ListRecordRequest = {
            app_token: appToken,
            table_id: tableId,
            ...(options?.viewId && { view_id: options.viewId }),
            ...(options?.fieldNames && { field_names: options.fieldNames }),
            ...(options?.filter && { filter: options.filter }),
            ...(options?.sort && { sort: options.sort }),
            ...(options?.pageSize && { page_size: options.pageSize }),
            ...(options?.textFieldAsArray !== undefined && { text_field_as_array: options.textFieldAsArray }),
            ...(options?.userIdType && { user_id_type: options.userIdType }),
            ...(options?.displayFormulaRef !== undefined && { display_formula_ref: options.displayFormulaRef }),
            ...(options?.automaticFields !== undefined && { automatic_fields: options.automaticFields }),
        };

        yield* this.larkClient.listBitableRecordsIterator(request);
    }

    /**
     * Get all records from a table using iterator (convenience method)
     */
    async getAllRecords(
        appToken: string,
        tableId: string,
        options?: {
            viewId?: string;
            fieldNames?: string;
            filter?: string;
            sort?: string;
            pageSize?: number;
        }
    ): Promise<LarkRecord[]> {
        const records: LarkRecord[] = [];

        for await (const record of this.listRecordsIterator(appToken, tableId, options)) {
            records.push(record);
        }

        this.logger.debug(`Retrieved ${records.length} records from table ${tableId}`);
        return records;
    }

    /**
     * Test the Bitable service connection
     */
    async testConnection(): Promise<boolean> {
        return this.larkClient.testConnection();
    }
}