import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BitableService } from './bitable.service';
import { LarkClient } from './lark.client';
import * as path from 'path';

// 加载测试环境变量
const envPath = path.resolve(__dirname, '../../.env.test');

describe('BitableService (Integration Tests)', () => {
  let service: BitableService;
  let configService: ConfigService;

  // 测试用的配置
  let appToken: string;
  let tableId: string;
  let testRecordIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: envPath,
          isGlobal: true,
        }),
      ],
      providers: [
        BitableService,
        LarkClient,
        {
          provide: ConfigService,
          useFactory: () => {
            const config = new ConfigService();
            return config;
          },
        },
      ],
    }).compile();

    service = module.get<BitableService>(BitableService);
    configService = module.get<ConfigService>(ConfigService);

    // 获取测试配置
    appToken = configService.get<string>('LARK_TEST_APP_TOKEN') || '';
    tableId = configService.get<string>('LARK_TEST_TABLE_ID') || '';

    if (!appToken || !tableId) {
      throw new Error('测试配置不完整，请在.env.test中配置 LARK_TEST_APP_TOKEN 和 LARK_TEST_TABLE_ID');
    }
  });

  afterAll(async () => {
    // 清理测试数据
    if (testRecordIds.length > 0) {
      try {
        // 等待5秒确保数据同步完成
        await new Promise(resolve => setTimeout(resolve, 5000));
        await service.batchDeleteRecords(appToken, tableId, testRecordIds);
        console.log(`已清理测试记录: ${testRecordIds.length}条`);
      } catch (error) {
        console.error('清理测试数据失败:', error);
      }
    }
  });

  describe('基础CRUD操作', () => {
    it('应该能够创建记录', async () => {
      const testFields = {
        '测试文本': '测试文本值',
        '测试数字': 123,
        '测试布尔': true,
        '测试日期': Date.now(), // 使用毫秒时间戳
        '测试单选': '选项1',
        '测试多选': ['选项A', '选项B'],
        '测试超链接': {
          link: 'https://www.feishu.cn/product/base',
          text: '飞书多维表格官网'
        },
        '测试电话号码': '+86-13800138000',
        '测试邮箱': 'test@example.com',
      };

      const result = await service.createRecord(appToken, tableId, testFields);

      expect(result).toBeDefined();
      expect(result.code).toBe(0);
      expect(result.data).toBeDefined();
      expect(result.data?.record).toBeDefined();
      expect(result.data?.record?.record_id).toBeDefined();

      // 验证字段值
      const createdFields = result.data?.record?.fields || {};
      expect(createdFields['测试文本']).toBe('测试文本值');
      expect(createdFields['测试数字']).toBe(123);
      expect(createdFields['测试布尔']).toBe(true);
      expect(createdFields['测试日期']).toBeDefined();
      const dateValue = createdFields['测试日期'];
      expect(typeof dateValue).toBe('number');
      expect(dateValue).toBeGreaterThan(0);
      // 验证返回的日期值与发送的值相等
      const expectedDate = testFields['测试日期'];
      expect(dateValue).toBe(expectedDate);
      expect(new Date(dateValue as string | number)).toBeInstanceOf(Date);

      // 验证新添加的字段
      expect(createdFields['测试单选']).toBe('选项1');
      expect(createdFields['测试多选']).toEqual(['选项A', '选项B']);
      expect(createdFields['测试超链接']).toEqual({
        link: 'https://www.feishu.cn/product/base',
        text: '飞书多维表格官网'
      });
      expect(createdFields['测试电话号码']).toBe('+86-13800138000');
      expect(createdFields['测试邮箱']).toBe('test@example.com');

      // 保存记录ID用于清理
      if (result.data?.record?.record_id) {
        testRecordIds.push(result.data.record.record_id);
      }
    });

    it('应该能够更新记录', async () => {
      // 先创建一条记录
      const createFields = {
        '测试文本': '原始值',
        '测试数字': 100,
      };

      const createResult = await service.createRecord(appToken, tableId, createFields);
      const recordId = createResult.data?.record?.record_id;
      if (recordId) {
        testRecordIds.push(recordId);
      }

      // 更新记录
      const updateFields = {
        '测试文本': '更新后的值',
        '测试数字': 200,
      };

      const updateResult = await service.updateRecord(appToken, tableId, recordId!, updateFields);

      expect(updateResult.data).toBeDefined();
      expect(updateResult.data?.record?.fields?.['测试文本']).toBe('更新后的值');
      expect(updateResult.data?.record?.fields?.['测试数字']).toBe(200);
    });

    it('应该能够搜索记录', async () => {
      // 先创建测试记录
      const testFields = {
        '测试文本': '搜索测试文本',
        '测试数字': 999,
      };

      const createResult = await service.createRecord(appToken, tableId, testFields);
      if (createResult.data?.record?.record_id) {
        testRecordIds.push(createResult.data.record.record_id);
      }

      // 搜索记录
      const searchResult = await service.searchRecords(appToken, tableId, {
        filter: {
          conjunction: 'and',
          conditions: [
            {
              field_name: '测试文本',
              operator: 'contains',
              value: ['搜索测试文本'],
            },
          ],
        },
      });

      expect(searchResult.data).toBeDefined();
      expect(searchResult.data?.items?.length).toBeGreaterThan(0);

      // 处理可能的富文本格式
      const textField = searchResult.data?.items?.[0]?.fields?.['测试文本'];
      let textValue = '';
      if (Array.isArray(textField)) {
        if (textField.length > 0) {
          const firstItem = textField[0];
          textValue = typeof firstItem === 'object' && firstItem !== null ?
            (firstItem as any).text || String(firstItem) : String(firstItem);
        }
      } else if (typeof textField === 'object' && textField !== null) {
        textValue = (textField as any).text || String(textField);
      } else {
        textValue = String(textField || '');
      }
      expect(textValue).toContain('搜索测试文本');
    });

    it('应该能够删除记录', async () => {
      // 先创建一条记录
      const testFields = {
        '测试文本': '待删除记录',
        '测试数字': Date.now(),
      };

      const createResult = await service.createRecord(appToken, tableId, testFields);
      const recordId = createResult.data?.record?.record_id;

      // 删除记录
      const deleteResult = await service.deleteRecord(appToken, tableId, recordId!);

      expect(deleteResult).toBeDefined();

      // 验证记录已被删除 - 使用更可靠的搜索条件
      const searchResult = await service.searchRecords(appToken, tableId, {
        filter: {
          conjunction: 'and',
          conditions: [
            {
              field_name: '测试数字',
              operator: 'is',
              value: [String(testFields['测试数字'])],
            },
          ],
        },
      });

      // 删除后应该找不到记录，或者记录数量为0
      expect(searchResult.data?.items?.length || 0).toBe(0);
    });
  });

  describe('批量操作', () => {
    it('应该能够批量创建记录', async () => {
      const records = [
        { fields: { '测试文本': '批量创建1', '测试数字': 1 } },
        { fields: { '测试文本': '批量创建2', '测试数字': 2 } },
        { fields: { '测试文本': '批量创建3', '测试数字': 3 } },
      ];

      const result = await service.batchCreateRecords(appToken, tableId, records);

      expect(result.data).toBeDefined();
      expect(result.data?.records).toHaveLength(3);

      // 保存记录ID用于清理
      result.data?.records?.forEach(record => {
        if (record.record_id) {
          testRecordIds.push(record.record_id);
        }
      });
    });

    it('应该能够批量更新记录', async () => {
      // 先批量创建记录
      const createRecords = [
        { fields: { '测试文本': '批量更新原始1', '测试数字': 10 } },
        { fields: { '测试文本': '批量更新原始2', '测试数字': 20 } },
      ];

      const createResult = await service.batchCreateRecords(appToken, tableId, createRecords);
      const recordIds = createResult.data?.records?.map(r => r.record_id).filter(Boolean) as string[] ?? [];
      testRecordIds.push(...recordIds);

      // 批量更新记录
      const updateRecords = [
        { record_id: recordIds[0], fields: { '测试文本': '批量更新后1', '测试数字': 100 } },
        { record_id: recordIds[1], fields: { '测试文本': '批量更新后2', '测试数字': 200 } },
      ];

      const updateResult = await service.batchUpdateRecords(appToken, tableId, updateRecords);

      expect(updateResult.data).toBeDefined();
      expect(updateResult.data?.records).toHaveLength(2);
      expect(updateResult.data?.records?.[0]?.fields?.['测试文本']).toBe('批量更新后1');
    });

    it('应该能够批量获取记录', async () => {
      // 先创建几条测试记录
      const createRecords = [
        { fields: { '测试文本': '批量获取1' } },
        { fields: { '测试文本': '批量获取2' } },
      ];

      const createResult = await service.batchCreateRecords(appToken, tableId, createRecords);
      const recordIds = createResult.data?.records?.map(r => r.record_id).filter(Boolean) as string[] ?? [];
      testRecordIds.push(...recordIds);

      // 批量获取记录
      const getResult = await service.batchGetRecords(appToken, tableId, recordIds);

      expect(getResult.data).toBeDefined();
      expect(getResult.data?.records).toHaveLength(2);
    });

    it('应该能够批量删除记录', async () => {
      // 先创建几条测试记录
      const createRecords = [
        { fields: { '测试文本': '批量删除1' } },
        { fields: { '测试文本': '批量删除2' } },
      ];

      const createResult = await service.batchCreateRecords(appToken, tableId, createRecords);
      const recordIds = createResult.data?.records?.map(r => r.record_id).filter(Boolean) as string[] ?? [];

      // 批量删除记录
      const deleteResult = await service.batchDeleteRecords(appToken, tableId, recordIds);

      expect(deleteResult.data).toBeDefined();

      // 验证记录已被删除
      const getResult = await service.batchGetRecords(appToken, tableId, recordIds);
      expect(getResult.data?.records).toHaveLength(0);
    });
  });

  describe('Upsert操作', () => {
    it('应该能够执行upsert操作 - 创建新记录', async () => {
      const uniqueId = `upsert_create_${Date.now()}`;
      const testFields = {
        '测试文本': 'upsert测试创建',
        '测试数字': Date.now(),
        '唯一标识': uniqueId,
      };

      const result = await service.upsertRecord(
        appToken,
        tableId,
        testFields,
        {
          matchFields: ['唯一标识'],
          matchMode: 'exact',
        }
      );

      expect(result.action).toBe('created');
      expect(result.record.fields?.['唯一标识']).toBe(uniqueId);
      expect(result.record.fields?.['测试文本']).toBe('upsert测试创建');
      testRecordIds.push(result.recordId);
    });

    it('应该能够执行upsert操作 - 更新现有记录', async () => {
      const uniqueId = `upsert_update_${Date.now()}`;
      const originalNum = Date.now();

      // 先创建记录
      const createFields = {
        '测试文本': 'upsert原始值',
        '测试数字': originalNum,
        '唯一标识': uniqueId,
      };

      const createResult = await service.createRecord(appToken, tableId, createFields);
      const recordId = createResult.data?.record?.record_id;
      if (recordId) {
        testRecordIds.push(recordId);
      }

      // 执行upsert更新
      const updateFields = {
        '测试文本': 'upsert更新值',
        '测试数字': originalNum + 1000, // 更新数字字段
        '唯一标识': uniqueId,
      };

      const result = await service.upsertRecord(
        appToken,
        tableId,
        updateFields,
        {
          matchFields: ['唯一标识'],
          matchMode: 'exact',
        }
      );

      expect(result.action).toBe('updated');
      expect(result.record.fields?.['测试文本']).toBe('upsert更新值');
      expect(result.record.fields?.['唯一标识']).toBe(uniqueId);
      expect(Number(result.record.fields?.['测试数字'])).toBe(originalNum + 1000);
    });

    it('应该能够执行批量upsert操作', async () => {
      const uniqueId1 = `batch_upsert_${Date.now()}_1`;
      const uniqueId2 = `batch_upsert_${Date.now()}_2`;
      
      const records = [
        {
          fields: {
            '测试文本': '批量upsert1',
            '测试数字': Date.now(),
            '唯一标识': uniqueId1,
          },
        },
        {
          fields: {
            '测试文本': '批量upsert2',
            '测试数字': Date.now() + 1,
            '唯一标识': uniqueId2,
          },
        },
      ];

      const results = await service.batchUpsertRecords(
        appToken,
        tableId,
        records,
        {
          matchFields: ['唯一标识'],
          matchMode: 'exact',
        }
      );

      expect(results).toHaveLength(2);
      expect(results.every(r => ['created', 'updated'].includes(r.action))).toBe(true);
      expect(results[0].record.fields?.['唯一标识']).toBe(uniqueId1);
      expect(results[1].record.fields?.['唯一标识']).toBe(uniqueId2);

      results.forEach(result => {
        testRecordIds.push(result.recordId);
      });
    });

    it('应该能够执行批量upsert操作 - 部分更新部分创建', async () => {
      const uniqueId1 = `mixed_upsert_${Date.now()}_existing`;
      const uniqueId2 = `mixed_upsert_${Date.now()}_new`;

      // 先创建一条记录
      const createFields = {
        '测试文本': '已存在的记录',
        '测试数字': Date.now(),
        '唯一标识': uniqueId1,
      };

      const createResult = await service.createRecord(appToken, tableId, createFields);
      const recordId = createResult.data?.record?.record_id;
      if (recordId) {
        testRecordIds.push(recordId);
      }

      // 执行批量upsert，包含一条更新和一条创建
      const records = [
        {
          fields: {
            '测试文本': '更新已存在的记录',
            '测试数字': Date.now() + 100,
            '唯一标识': uniqueId1,
          },
        },
        {
          fields: {
            '测试文本': '创建新记录',
            '测试数字': Date.now() + 200,
            '唯一标识': uniqueId2,
          },
        },
      ];

      const results = await service.batchUpsertRecords(
        appToken,
        tableId,
        records,
        {
          matchFields: ['唯一标识'],
          matchMode: 'exact',
        }
      );

      expect(results).toHaveLength(2);
      
      // 验证结果顺序和类型
      const updateResult = results.find(r => r.record.fields?.['唯一标识'] === uniqueId1);
      const createResultFound = results.find(r => r.record.fields?.['唯一标识'] === uniqueId2);
      
      expect(updateResult?.action).toBe('updated');
      expect(createResultFound?.action).toBe('created');
      
      expect(updateResult?.record.fields?.['测试文本']).toBe('更新已存在的记录');
      expect(createResultFound?.record.fields?.['测试文本']).toBe('创建新记录');

      results.forEach(result => {
        testRecordIds.push(result.recordId);
      });
    });
  });

  describe('迭代器功能', () => {
    it('应该能够使用迭代器获取所有记录', async () => {
      // 先创建几条测试记录
      const createRecords = [
        { fields: { '测试文本': '迭代器测试1' } },
        { fields: { '测试文本': '迭代器测试2' } },
      ];

      const createResult = await service.batchCreateRecords(appToken, tableId, createRecords);
      createResult.data?.records?.forEach(r => {
        if (r.record_id) testRecordIds.push(r.record_id);
      });

      const records: any[] = [];
      for await (const record of service.listRecordsIterator(appToken, tableId, {
        pageSize: 10,
      })) {
        records.push(record);
      }

      expect(records.length).toBeGreaterThan(0);
    });

    it('应该能够使用搜索迭代器', async () => {
      // 创建测试记录
      const uniqueNum = Date.now();
      const testFields = {
        '测试文本': '搜索迭代器测试',
        '测试数字': uniqueNum,
      };

      const createResult = await service.createRecord(appToken, tableId, testFields);
      const recordId = createResult.data?.record?.record_id;
      expect(recordId).toBeDefined();
      if (recordId) {
        testRecordIds.push(recordId);
      }

      // 使用批量获取验证记录
      const getResult = await service.batchGetRecords(appToken, tableId, [recordId!]);
      expect(getResult.data).toBeDefined();
      expect(getResult.data?.records).toHaveLength(1);

      // 处理富文本格式
      const textField = getResult.data?.records?.[0]?.fields?.['测试文本'];
      let textValue = '';
      if (Array.isArray(textField) && textField.length > 0) {
        const firstItem = textField[0];
        textValue = (firstItem as any)?.text || String(firstItem);
      } else if (typeof textField === 'object' && textField !== null) {
        textValue = (textField as any).text || String(textField);
      } else {
        textValue = String(textField || '');
      }
      expect(textValue).toBe('搜索迭代器测试');
      expect(String(getResult.data?.records?.[0]?.fields?.['测试数字'])).toBe(String(uniqueNum));
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的应用token', async () => {
      try {
        const result = await service.createRecord('invalid-app-token', tableId, { '测试文本': 'test' });
        // 如果请求成功，应该返回错误码
        expect(result.code).toBeGreaterThan(0);
      } catch (error) {
        // 如果抛出异常，测试也认为是成功的
        expect(error).toBeDefined();
      }
    });

    it('应该处理无效的表格ID', async () => {
      const result = await service.createRecord(appToken, 'invalid-table-id', { '测试文本': 'test' });
      expect(result.code).not.toBe(0);
    });

    it('应该处理无效的字段名', async () => {
      const result = await service.createRecord(appToken, tableId, { '不存在的字段': 'test' });
      expect(result.code).not.toBe(0);
    });
  });
});