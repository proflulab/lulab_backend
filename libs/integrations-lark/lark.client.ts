import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lark from '@larksuiteoapi/node-sdk';
import {
    LarkClientConfig,
    CreateRecordRequest,
    CreateRecordResponse,
    UpdateRecordRequest,
    UpdateRecordResponse,
    SearchRecordRequest,
    SearchRecordResponse,
    SearchRecordIteratorOptions,
    ListRecordRequest,
    ListRecordResponse,
    LarkRecord,
    DeleteRecordRequest,
    DeleteRecordResponse,
    BatchCreateRecordRequest,
    BatchCreateRecordResponse,
    BatchUpdateRecordRequest,
    BatchUpdateRecordResponse,
    BatchGetRecordRequest,
    BatchGetRecordResponse,
    BatchDeleteRecordRequest,
    BatchDeleteRecordResponse
} from './lark.types';

@Injectable()
export class LarkClient {
    private readonly logger = new Logger(LarkClient.name);
    private client: lark.Client;

    constructor(private readonly configService: ConfigService) {
        const config: LarkClientConfig = {
            appId: this.configService.get<string>('LARK_APP_ID') || '',
            appSecret: this.configService.get<string>('LARK_APP_SECRET') || '',
            logLevel: this.configService.get<'debug' | 'info' | 'warn' | 'error'>('LARK_LOG_LEVEL') || 'info',
        };

        if (!config.appId || !config.appSecret) {
            this.logger.warn('Lark app credentials not configured. Please set LARK_APP_ID and LARK_APP_SECRET environment variables.');
        }

        this.client = new lark.Client({
            appId: config.appId,
            appSecret: config.appSecret,
        });

        this.logger.log('Lark client initialized successfully');
    }

    /**
     * Get the underlying Lark client instance
     */
    getClient(): lark.Client {
        return this.client;
    }

    /**
     * Create a record in Bitable (Multi-dimensional table)
     */
    async createBitableRecord(request: CreateRecordRequest): Promise<CreateRecordResponse> {
        try {
            this.logger.debug(`Creating Bitable record in app: ${request.app_token}, table: ${request.table_id}`);

            // Convert fields to the format expected by Lark API
            const fieldsData = this.formatFields(request.fields);

            const response = await this.client.bitable.v1.appTableRecord.create({
                path: {
                    app_token: request.app_token,
                    table_id: request.table_id,
                },
                data: {
                    fields: fieldsData,
                },
            });

            this.logger.debug('Bitable record created successfully', { recordId: response.data?.record?.record_id });
            return response as CreateRecordResponse;
        } catch (error) {
            this.logger.error('Failed to create Bitable record', error);
            throw error;
        }
    }

    /**
     * Update a record in Bitable (Multi-dimensional table)
     */
    async updateBitableRecord(request: UpdateRecordRequest): Promise<UpdateRecordResponse> {
        try {
            this.logger.debug(`Updating Bitable record ${request.record_id} in app: ${request.app_token}, table: ${request.table_id}`);

            // Convert fields to the format expected by Lark API
            const fieldsData = this.formatFields(request.fields);

            const response = await this.client.bitable.v1.appTableRecord.update({
                path: {
                    app_token: request.app_token,
                    table_id: request.table_id,
                    record_id: request.record_id,
                },
                data: {
                    fields: fieldsData,
                },
            });

            this.logger.debug('Bitable record updated successfully', { recordId: response.data?.record?.record_id });
            return response as UpdateRecordResponse;
        } catch (error) {
            this.logger.error('Failed to update Bitable record', error);
            throw error;
        }
    }

    /**
     * Search records in Bitable (Multi-dimensional table)
     */
    async searchBitableRecords(request: SearchRecordRequest): Promise<SearchRecordResponse> {
        try {
            this.logger.debug(`Searching Bitable records in app: ${request.app_token}, table: ${request.table_id}`);

            const response = await this.client.bitable.v1.appTableRecord.search({
                path: {
                    app_token: request.app_token,
                    table_id: request.table_id,
                },
                params: {
                    page_size: request.page_size || 20,
                    ...(request.page_token && { page_token: request.page_token }),
                },
                data: {
                    ...(request.view_id && { view_id: request.view_id }),
                    ...(request.field_names && { field_names: request.field_names }),
                    ...(request.sort && { sort: request.sort }),
                    ...(request.filter && { filter: request.filter }),
                    ...(request.automatic_fields !== undefined && { automatic_fields: request.automatic_fields }),
                },
            });

            this.logger.debug(`Found ${response.data?.items?.length || 0} records`);
            return response as SearchRecordResponse;
        } catch (error) {
            this.logger.error('Failed to search Bitable records', error);
            throw error;
        }
    }

    /**
     * Search records in Bitable with iterator for convenient pagination
     */
    async *searchBitableRecordsIterator(options: SearchRecordIteratorOptions): AsyncGenerator<LarkRecord, void, unknown> {
        try {
            this.logger.debug(`Searching Bitable records with iterator in app: ${options.app_token}, table: ${options.table_id}`);

            const iteratorPromise = this.client.bitable.v1.appTableRecord.searchWithIterator({
                path: {
                    app_token: options.app_token,
                    table_id: options.table_id,
                },
                params: {
                    page_size: options.page_size || 20,
                    ...(options.user_id_type && { user_id_type: options.user_id_type }),
                },
                data: {
                    ...(options.view_id && { view_id: options.view_id }),
                    ...(options.field_names && { field_names: options.field_names }),
                    ...(options.sort && { sort: options.sort }),
                    ...(options.filter && { filter: options.filter }),
                },
            });

            const iterator = await iteratorPromise;
            for await (const item of iterator) {
                yield item as LarkRecord;
            }
        } catch (error) {
            this.logger.error('Failed to search Bitable records with iterator', error);
            throw error;
        }
    }

    /**
     * List records in Bitable (Multi-dimensional table)
     * This is an alternative to search that uses the list endpoint
     */
    async listBitableRecords(request: ListRecordRequest): Promise<ListRecordResponse> {
        try {
            this.logger.debug(`Listing Bitable records in app: ${request.app_token}, table: ${request.table_id}`);

            const response = await this.client.bitable.v1.appTableRecord.list({
                path: {
                    app_token: request.app_token,
                    table_id: request.table_id,
                },
                params: {
                    page_size: request.page_size || 20,
                    ...(request.page_token && { page_token: request.page_token }),
                    ...(request.view_id && { view_id: request.view_id }),
                    ...(request.field_names && { field_names: request.field_names }),
                    ...(request.filter && { filter: request.filter }),
                    ...(request.sort && { sort: request.sort }),
                    ...(request.text_field_as_array !== undefined && { text_field_as_array: request.text_field_as_array }),
                    ...(request.user_id_type && { user_id_type: request.user_id_type }),
                    ...(request.display_formula_ref !== undefined && { display_formula_ref: request.display_formula_ref }),
                    ...(request.automatic_fields !== undefined && { automatic_fields: request.automatic_fields }),
                },
            });

            this.logger.debug(`Listed ${response.data?.items?.length || 0} records`);
            return response as ListRecordResponse;
        } catch (error) {
            this.logger.error('Failed to list Bitable records', error);
            throw error;
        }
    }

    /**
     * List records in Bitable with iterator for convenient pagination
     */
    async *listBitableRecordsIterator(request: ListRecordRequest): AsyncGenerator<LarkRecord, void, unknown> {
        try {
            this.logger.debug(`Listing Bitable records with iterator in app: ${request.app_token}, table: ${request.table_id}`);

            const iteratorPromise = this.client.bitable.v1.appTableRecord.listWithIterator({
                path: {
                    app_token: request.app_token,
                    table_id: request.table_id,
                },
                params: {
                    page_size: request.page_size || 20,
                    ...(request.view_id && { view_id: request.view_id }),
                    ...(request.field_names && { field_names: request.field_names }),
                    ...(request.filter && { filter: request.filter }),
                    ...(request.sort && { sort: request.sort }),
                    ...(request.text_field_as_array !== undefined && { text_field_as_array: request.text_field_as_array }),
                    ...(request.user_id_type && { user_id_type: request.user_id_type }),
                    ...(request.display_formula_ref !== undefined && { display_formula_ref: request.display_formula_ref }),
                    ...(request.automatic_fields !== undefined && { automatic_fields: request.automatic_fields }),
                },
            });

            const iterator = await iteratorPromise;
            for await (const item of iterator) {
                yield item as LarkRecord;
            }
        } catch (error) {
            this.logger.error('Failed to list Bitable records with iterator', error);
            throw error;
        }
    }

    /**
     * Format fields for Lark API
     * Handles Map to Object conversion and filters out null/undefined values
     */
    private formatFields(fields: Record<string, any> | Map<string, any>): Record<string, any> {
        let baseFields: Record<string, any>;

        // Handle Map to Object conversion
        if (fields instanceof Map) {
            baseFields = Object.fromEntries(fields.entries());
        } else {
            baseFields = fields;
        }

        // Filter out null/undefined values
        const formattedFields: Record<string, any> = {};
        Object.entries(baseFields).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formattedFields[key] = value;
            }
        });

        return formattedFields;
    }

    /**
     * Delete a record in Bitable (Multi-dimensional table)
     */
    async deleteBitableRecord(request: DeleteRecordRequest): Promise<DeleteRecordResponse> {
        try {
            this.logger.debug(`Deleting Bitable record ${request.record_id} in app: ${request.app_token}, table: ${request.table_id}`);

            const response = await this.client.bitable.v1.appTableRecord.delete({
                path: {
                    app_token: request.app_token,
                    table_id: request.table_id,
                    record_id: request.record_id,
                },
            });

            this.logger.debug('Bitable record deleted successfully', { recordId: request.record_id });
            return response as DeleteRecordResponse;
        } catch (error) {
            this.logger.error('Failed to delete Bitable record', error);
            throw error;
        }
    }

    /**
     * Batch create records in Bitable (Multi-dimensional table)
     */
    async batchCreateBitableRecords(request: BatchCreateRecordRequest): Promise<BatchCreateRecordResponse> {
        try {
            this.logger.debug(`Batch creating Bitable records in app: ${request.app_token}, table: ${request.table_id}`);

            // Convert fields for each record
            const recordsData = request.records.map(record => ({
                fields: this.formatFields(record.fields)
            }));

            const response = await this.client.bitable.v1.appTableRecord.batchCreate({
                path: {
                    app_token: request.app_token,
                    table_id: request.table_id,
                },
                data: {
                    records: recordsData,
                },
            });

            this.logger.debug(`Batch created ${response.data?.records?.length || 0} records`);
            return response as BatchCreateRecordResponse;
        } catch (error) {
            this.logger.error('Failed to batch create Bitable records', error);
            throw error;
        }
    }

    /**
     * Batch update records in Bitable (Multi-dimensional table)
     */
    async batchUpdateBitableRecords(request: BatchUpdateRecordRequest): Promise<BatchUpdateRecordResponse> {
        try {
            this.logger.debug(`Batch updating Bitable records in app: ${request.app_token}, table: ${request.table_id}`);

            // Convert fields for each record
            const recordsData = request.records.map(record => ({
                record_id: record.record_id,
                fields: this.formatFields(record.fields)
            }));

            const response = await this.client.bitable.v1.appTableRecord.batchUpdate({
                path: {
                    app_token: request.app_token,
                    table_id: request.table_id,
                },
                params: {
                    ...(request.user_id_type && { user_id_type: request.user_id_type }),
                },
                data: {
                    records: recordsData,
                },
            });

            this.logger.debug(`Batch updated ${response.data?.records?.length || 0} records`);
            return response as BatchUpdateRecordResponse;
        } catch (error) {
            this.logger.error('Failed to batch update Bitable records', error);
            throw error;
        }
    }

    /**
     * Batch get records in Bitable (Multi-dimensional table)
     */
    async batchGetBitableRecords(request: BatchGetRecordRequest): Promise<BatchGetRecordResponse> {
        try {
            this.logger.debug(`Batch getting Bitable records in app: ${request.app_token}, table: ${request.table_id}`);

            const response = await this.client.bitable.v1.appTableRecord.batchGet({
                path: {
                    app_token: request.app_token,
                    table_id: request.table_id,
                },
                data: {
                    record_ids: request.record_ids,
                    ...(request.user_id_type && { user_id_type: request.user_id_type }),
                    ...(request.with_shared_url !== undefined && { with_shared_url: request.with_shared_url }),
                    ...(request.automatic_fields !== undefined && { automatic_fields: request.automatic_fields }),
                },
            });

            this.logger.debug(`Batch got ${response.data?.records?.length || 0} records`);
            return response as BatchGetRecordResponse;
        } catch (error) {
            this.logger.error('Failed to batch get Bitable records', error);
            throw error;
        }
    }

    /**
     * Batch delete records in Bitable (Multi-dimensional table)
     */
    async batchDeleteBitableRecords(request: BatchDeleteRecordRequest): Promise<BatchDeleteRecordResponse> {
        try {
            this.logger.debug(`Batch deleting Bitable records in app: ${request.app_token}, table: ${request.table_id}`);

            const response = await this.client.bitable.v1.appTableRecord.batchDelete({
                path: {
                    app_token: request.app_token,
                    table_id: request.table_id,
                },
                data: {
                    records: request.records,
                },
            });

            this.logger.debug(`Batch deleted ${request.records.length} records`);
            return response as BatchDeleteRecordResponse;
        } catch (error) {
            this.logger.error('Failed to batch delete Bitable records', error);
            throw error;
        }
    }

    /**
     * Test the connection to Lark API
     */
    async testConnection(): Promise<boolean> {
        try {
            // Try to create a tenant access token to test credentials
            const tokenResponse = await this.client.auth.tenantAccessToken.create();
            this.logger.log('Lark connection test successful');
            return !!tokenResponse;
        } catch (error) {
            this.logger.error('Lark connection test failed', error);
            return false;
        }
    }
}