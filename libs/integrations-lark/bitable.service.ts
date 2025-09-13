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
  LarkRecord,
  SearchFilterCondition,
  DeleteRecordRequest,
  DeleteRecordResponse,
  BatchCreateRecordRequest,
  BatchCreateRecordResponse,
  BatchUpdateRecordRequest,
  BatchUpdateRecordResponse,
  BatchGetRecordRequest,
  BatchGetRecordResponse,
  BatchDeleteRecordRequest,
  BatchDeleteRecordResponse,
} from './lark.types';

@Injectable()
export class BitableService {
  private readonly logger = new Logger(BitableService.name);

  constructor(private readonly larkClient: LarkClient) {}

  /**
   * Create a simple record with common field types
   */
  async createRecord(
    appToken: string,
    tableId: string,
    fields: BitableField,
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
    fields: BitableField,
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
    },
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
      ...(options?.automaticFields !== undefined && {
        automatic_fields: options.automaticFields,
      }),
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
    },
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
      fieldNames?: string; // Note: List API expects comma-separated string
      filter?: string;
      sort?: string; // Note: List API expects string format
      pageSize?: number;
      pageToken?: string;
      textFieldAsArray?: boolean;
      userIdType?: 'user_id' | 'union_id' | 'open_id';
      displayFormulaRef?: boolean;
      automaticFields?: boolean;
    },
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
      ...(options?.textFieldAsArray !== undefined && {
        text_field_as_array: options.textFieldAsArray,
      }),
      ...(options?.userIdType && { user_id_type: options.userIdType }),
      ...(options?.displayFormulaRef !== undefined && {
        display_formula_ref: options.displayFormulaRef,
      }),
      ...(options?.automaticFields !== undefined && {
        automatic_fields: options.automaticFields,
      }),
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
      fieldNames?: string; // Note: List API expects comma-separated string
      filter?: string;
      sort?: string; // Note: List API expects string format
      pageSize?: number;
      textFieldAsArray?: boolean;
      userIdType?: 'user_id' | 'union_id' | 'open_id';
      displayFormulaRef?: boolean;
      automaticFields?: boolean;
    },
  ): AsyncGenerator<LarkRecord, void, unknown> {
    const request: ListRecordRequest = {
      app_token: appToken,
      table_id: tableId,
      ...(options?.viewId && { view_id: options.viewId }),
      ...(options?.fieldNames && { field_names: options.fieldNames }),
      ...(options?.filter && { filter: options.filter }),
      ...(options?.sort && { sort: options.sort }),
      ...(options?.pageSize && { page_size: options.pageSize }),
      ...(options?.textFieldAsArray !== undefined && {
        text_field_as_array: options.textFieldAsArray,
      }),
      ...(options?.userIdType && { user_id_type: options.userIdType }),
      ...(options?.displayFormulaRef !== undefined && {
        display_formula_ref: options.displayFormulaRef,
      }),
      ...(options?.automaticFields !== undefined && {
        automatic_fields: options.automaticFields,
      }),
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
    },
  ): Promise<LarkRecord[]> {
    const records: LarkRecord[] = [];

    for await (const record of this.listRecordsIterator(
      appToken,
      tableId,
      options,
    )) {
      records.push(record);
    }

    this.logger.debug(
      `Retrieved ${records.length} records from table ${tableId}`,
    );
    return records;
  }

  /**
   * Delete a record from the table
   */
  async deleteRecord(
    appToken: string,
    tableId: string,
    recordId: string,
  ): Promise<DeleteRecordResponse> {
    const request: DeleteRecordRequest = {
      app_token: appToken,
      table_id: tableId,
      record_id: recordId,
    };

    return this.larkClient.deleteBitableRecord(request);
  }

  /**
   * Batch create multiple records
   */
  async batchCreateRecords(
    appToken: string,
    tableId: string,
    records: Array<{ fields: BitableField }>,
  ): Promise<BatchCreateRecordResponse> {
    const request: BatchCreateRecordRequest = {
      app_token: appToken,
      table_id: tableId,
      records,
    };

    return this.larkClient.batchCreateBitableRecords(request);
  }

  /**
   * Batch update multiple records
   */
  async batchUpdateRecords(
    appToken: string,
    tableId: string,
    records: Array<{ record_id: string; fields: BitableField }>,
    options?: {
      userIdType?: 'user_id' | 'union_id' | 'open_id';
    },
  ): Promise<BatchUpdateRecordResponse> {
    const request: BatchUpdateRecordRequest = {
      app_token: appToken,
      table_id: tableId,
      records,
      ...(options?.userIdType && { user_id_type: options.userIdType }),
    };

    return this.larkClient.batchUpdateBitableRecords(request);
  }

  /**
   * Batch get multiple records by their IDs
   */
  async batchGetRecords(
    appToken: string,
    tableId: string,
    recordIds: string[],
    options?: {
      userIdType?: 'user_id' | 'union_id' | 'open_id';
      withSharedUrl?: boolean;
      automaticFields?: boolean;
    },
  ): Promise<BatchGetRecordResponse> {
    const request: BatchGetRecordRequest = {
      app_token: appToken,
      table_id: tableId,
      record_ids: recordIds,
      ...(options?.userIdType && { user_id_type: options.userIdType }),
      ...(options?.withSharedUrl !== undefined && {
        with_shared_url: options.withSharedUrl,
      }),
      ...(options?.automaticFields !== undefined && {
        automatic_fields: options.automaticFields,
      }),
    };

    return this.larkClient.batchGetBitableRecords(request);
  }

  /**
   * Batch delete multiple records
   */
  async batchDeleteRecords(
    appToken: string,
    tableId: string,
    recordIds: string[],
  ): Promise<BatchDeleteRecordResponse> {
    const request: BatchDeleteRecordRequest = {
      app_token: appToken,
      table_id: tableId,
      records: recordIds,
    };

    return this.larkClient.batchDeleteBitableRecords(request);
  }

  /**
   * 通用方法：查询-更新或新增记录
   * 根据指定字段条件查询记录，存在则更新，不存在则新增
   *
   * @param appToken 应用token
   * @param tableId 表格ID
   * @param fields 要插入或更新的字段数据
   * @param queryConditions 查询条件配置
   * @param options 额外选项
   */
  async upsertRecord(
    appToken: string,
    tableId: string,
    fields: BitableField,
    queryConditions: {
      /** 用于匹配的字段名数组，支持单个或多个字段组合 */
      matchFields: string[];
      /** 匹配模式：'exact'精确匹配(默认), 'partial'部分匹配, 'or'或条件匹配 */
      matchMode?: 'exact' | 'partial' | 'or';
      /** 是否区分大小写，默认不区分 */
      caseSensitive?: boolean;
    },
    options?: {
      /** 更新时是否保留原有字段值（合并更新），默认false */
      mergeFields?: boolean;
      /** 更新时排除的字段名 */
      excludeFields?: string[];
      /** 返回完整的记录信息 */
      returnFullRecord?: boolean;
    },
  ): Promise<{
    action: 'created' | 'updated';
    record: LarkRecord;
    recordId: string;
  }> {
    const {
      matchFields,
      matchMode = 'exact',
      caseSensitive = false,
    } = queryConditions;
    const {
      mergeFields = false,
      excludeFields = [],
      returnFullRecord = true,
    } = options || {};

    try {
      // 1. 构建查询条件
      const searchFilter = this.buildSearchFilter(
        fields,
        matchFields,
        matchMode,
        caseSensitive,
      );

      // 2. 执行查询
      const searchResult = await this.searchRecords(appToken, tableId, {
        filter: searchFilter,
        pageSize: 10, // 通常我们只需要找到第一条匹配记录
      });

      // 3. 检查查询结果
      if (searchResult.data?.items && searchResult.data.items.length > 0) {
        // 找到匹配记录，执行更新
        const existingRecord = searchResult.data.items[0];
        let updateFields = { ...fields };

        // 处理排除字段
        if (excludeFields.length > 0) {
          excludeFields.forEach((field) => {
            delete updateFields[field];
          });
        }

        // 处理字段合并
        if (mergeFields) {
          updateFields = {
            ...existingRecord.fields,
            ...updateFields,
          };
        }

        const updateResult = await this.updateRecord(
          appToken,
          tableId,
          existingRecord.record_id,
          updateFields,
        );

        if (updateResult.data?.record) {
          this.logger.log(`记录已更新: ${existingRecord.record_id}`);
          return {
            action: 'updated',
            record: updateResult.data.record,
            recordId: existingRecord.record_id,
          };
        }
      }

      // 4. 没有找到匹配记录，执行新增
      const createResult = await this.createRecord(appToken, tableId, fields);

      if (createResult.data?.record) {
        this.logger.log(`记录已创建: ${createResult.data.record.record_id}`);
        return {
          action: 'created',
          record: createResult.data.record,
          recordId: createResult.data.record.record_id,
        };
      }

      throw new Error('创建记录失败：未返回记录数据');
    } catch (error) {
      this.logger.error(`执行upsert操作时出错: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量upsert操作
   * 对多条记录执行查询-更新或新增操作
   *
   * @description
   * 该方法支持批量处理多条记录，每条记录都会根据指定的查询条件执行以下操作：
   * 1. 根据matchFields指定的字段组合查询记录是否存在
   * 2. 如果找到匹配记录，则更新该记录
   * 3. 如果未找到匹配记录，则创建新记录
   *
   * @param appToken - 飞书应用token
   * @param tableId - 多维表格ID
   * @param records - 要处理的记录数组，每条记录可以包含：
   *   - fields: 要插入或更新的字段数据
   *   - queryConditions: 可选的自定义查询条件（如不指定则使用globalQueryConditions）
   * @param globalQueryConditions - 全局默认查询条件配置
   * @param options - 批量操作选项
   *   - mergeFields: 是否合并更新（保留原有字段值）
   *   - excludeFields: 更新时排除的字段名数组
   *   - batchSize: 每批处理的记录数量（默认10条，避免API限制）
   *
   * @returns 返回处理结果的数组，包含每条记录的操作类型和详细信息：
   *   - action: 'created' | 'updated' 操作类型
   *   - record: 完整的记录对象
   *   - recordId: 记录ID
   *   - index: 原始记录在输入数组中的索引位置
   *
   * @throws 当任何一条记录处理失败时，会抛出错误并停止后续处理
   *
   * @performance 采用分批处理机制，每批默认处理10条记录，避免API调用频率限制
   */
  async batchUpsertRecords(
    appToken: string,
    tableId: string,
    records: Array<{
      fields: BitableField;
      /** 可选的自定义查询条件，如不指定则使用全局配置 */
      queryConditions?: {
        matchFields: string[];
        matchMode?: 'exact' | 'partial' | 'or';
        caseSensitive?: boolean;
      };
    }>,
    globalQueryConditions: {
      matchFields: string[];
      matchMode?: 'exact' | 'partial' | 'or';
      caseSensitive?: boolean;
    },
    options?: {
      mergeFields?: boolean;
      excludeFields?: string[];
      returnFullRecord?: boolean;
      /** 批量大小，默认10条 */
      batchSize?: number;
    },
  ): Promise<
    Array<{
      action: 'created' | 'updated';
      record: LarkRecord;
      recordId: string;
      index: number;
    }>
  > {
    const results: Array<{
      action: 'created' | 'updated';
      record: LarkRecord;
      recordId: string;
      index: number;
    }> = [];
    const { batchSize = 10 } = options || {};

    // 分批处理避免API限制
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchPromises = batch.map(async (record, batchIndex) => {
        const queryConditions = record.queryConditions || globalQueryConditions;
        try {
          const result = await this.upsertRecord(
            appToken,
            tableId,
            record.fields,
            queryConditions,
            options,
          );
          return {
            ...result,
            index: i + batchIndex,
          };
        } catch (error) {
          this.logger.error(
            `批量upsert中第${i + batchIndex}条记录失败: ${error.message}`,
          );
          throw error;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    this.logger.log(`批量upsert完成：共处理${records.length}条记录`);
    return results;
  }

  /**
   * 构建搜索过滤器
   * @private
   */
  private buildSearchFilter(
    fields: BitableField,
    matchFields: string[],
    matchMode: 'exact' | 'partial' | 'or',
    caseSensitive: boolean,
  ): SearchFilter {
    const conditions: SearchFilterCondition[] = [];

    matchFields.forEach((fieldName) => {
      if (fields[fieldName] !== undefined) {
        const value = fields[fieldName];

        // 处理不同类型的值
        let searchValue: string[];
        if (Array.isArray(value)) {
          searchValue = value.map((v) =>
            typeof v === 'object' ? JSON.stringify(v) : String(v),
          );
        } else {
          searchValue = [String(value)];
        }

        // 处理大小写敏感性
        if (!caseSensitive) {
          searchValue = searchValue.map((v) => v.toLowerCase());
        }

        let operator: SearchFilterCondition['operator'];

        switch (matchMode) {
          case 'partial':
            operator = 'contains';
            break;
          case 'exact':
          default:
            operator = 'is';
            break;
        }

        conditions.push({
          field_name: fieldName,
          operator,
          value: searchValue,
        });
      }
    });

    if (conditions.length === 0) {
      throw new Error('没有有效的查询条件字段');
    }

    return {
      conjunction: matchMode === 'or' ? 'or' : 'and',
      conditions,
    };
  }

  /**
   * Test the Bitable service connection
   */
  async testConnection(): Promise<boolean> {
    return this.larkClient.testConnection();
  }
}
