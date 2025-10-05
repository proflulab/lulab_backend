/**
 * @fileoverview Unit tests for NumberRecordBitableRepository
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NumberRecordBitableRepository } from './number-record.repository';
import { BitableService } from '../services/bitable.service';
import { larkConfig } from '../../../configs/lark.config';
import { ConfigModule } from '@nestjs/config';

// Mock BitableService
const mockBitableService = {
  createRecord: jest.fn(),
  upsertRecord: jest.fn(),
  searchRecords: jest.fn(),
  updateRecord: jest.fn(),
};

// Mock config
const mockConfig = {
  bitable: {
    appToken: 'test-app-token',
    tableIds: {
      numberRecord: 'test-number-record-table-id',
    },
  },
};

describe('NumberRecordBitableRepository', () => {
  let repository: NumberRecordBitableRepository;
  let bitableService: jest.Mocked<BitableService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => mockConfig],
        }),
      ],
      providers: [
        NumberRecordBitableRepository,
        {
          provide: BitableService,
          useValue: mockBitableService,
        },
        {
          provide: larkConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    repository = module.get<NumberRecordBitableRepository>(
      NumberRecordBitableRepository,
    );
    bitableService = module.get(BitableService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createNumberRecord', () => {
    it('should create a new number record', async () => {
      const mockRecordData = {
        meet_participant: ['user123', '张三'],
        participant_summary: '这是参会者的个性化会议总结',
        meet_data: ['会议主题: 项目讨论', '会议时间: 2024-01-01 10:00:00'],
      };

      const mockResponse = {
        code: 0,
        msg: 'success',
        data: {
          record: {
            record_id: 'rec123',
            fields: mockRecordData,
            created_by: { id: 'user123', name: 'Test User' },
            created_time: Date.now(),
            last_modified_by: { id: 'user123', name: 'Test User' },
            last_modified_time: Date.now(),
          },
        },
      };

      bitableService.createRecord.mockResolvedValue(mockResponse);

      const result = await repository.createNumberRecord(mockRecordData);

      expect(bitableService.createRecord).toHaveBeenCalledWith(
        'test-app-token',
        'test-number-record-table-id',
        {
          meet_participant: mockRecordData.meet_participant,
          participant_summary: mockRecordData.participant_summary,
          meet_data: mockRecordData.meet_data,
        },
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('upsertNumberRecord', () => {
    it('should upsert a number record', async () => {
      const mockRecordData = {
        meet_participant: ['user456', '李四'],
        participant_summary: '这是另一个参会者的个性化会议总结',
        meet_data: ['会议主题: 技术评审', '会议时间: 2024-01-02 14:00:00'],
      };

      const mockUpsertResult = {
        action: 'created' as const,
        record: {
          record_id: 'rec456',
          fields: mockRecordData,
          created_by: { id: 'user456', name: 'Test User' },
          created_time: Date.now(),
          last_modified_by: { id: 'user456', name: 'Test User' },
          last_modified_time: Date.now(),
        },
        recordId: 'rec456',
      };

      bitableService.upsertRecord.mockResolvedValue(mockUpsertResult);

      const result = await repository.upsertNumberRecord(mockRecordData);

      expect(bitableService.upsertRecord).toHaveBeenCalledWith(
        'test-app-token',
        'test-number-record-table-id',
        {
          meet_participant: mockRecordData.meet_participant,
          participant_summary: mockRecordData.participant_summary,
          meet_data: mockRecordData.meet_data,
        },
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
      expect(result).toEqual({
        code: 0,
        msg: 'success',
        data: {
          record: mockUpsertResult.record,
        },
      });
    });
  });

  describe('searchNumberRecordByParticipants', () => {
    it('should search records by participants', async () => {
      const participants = ['user789', '王五'];
      const mockSearchResult = {
        code: 0,
        msg: 'success',
        data: {
          items: [
            {
              record_id: 'rec789',
              fields: {
                meet_participant: participants,
                participant_summary: '测试总结',
                meet_data: ['测试数据'],
              },
              created_by: { id: 'user789', name: 'Test User' },
              created_time: Date.now(),
              last_modified_by: { id: 'user789', name: 'Test User' },
              last_modified_time: Date.now(),
            },
          ],
          has_more: false,
          total: 1,
        },
      };

      bitableService.searchRecords.mockResolvedValue(mockSearchResult);

      const result =
        await repository.searchNumberRecordByParticipants(participants);

      expect(bitableService.searchRecords).toHaveBeenCalledWith(
        'test-app-token',
        'test-number-record-table-id',
        {
          filter: {
            conjunction: 'and',
            conditions: [
              {
                field_name: 'meet_participant',
                operator: 'is',
                value: participants,
              },
            ],
          },
        },
      );
      expect(result).toEqual(mockSearchResult);
    });
  });

  describe('updateNumberRecordById', () => {
    it('should update a number record by ID', async () => {
      const recordId = 'rec123';
      const updateData = {
        participant_summary: '更新的参会者总结',
      };

      const mockUpdateResult = {
        code: 0,
        msg: 'success',
        data: {
          record: {
            record_id: recordId,
            fields: updateData,
            created_by: { id: 'user123', name: 'Test User' },
            created_time: Date.now(),
            last_modified_by: { id: 'user123', name: 'Test User' },
            last_modified_time: Date.now(),
          },
        },
      };

      bitableService.updateRecord.mockResolvedValue(mockUpdateResult);

      const result = await repository.updateNumberRecordById(
        recordId,
        updateData,
      );

      expect(bitableService.updateRecord).toHaveBeenCalledWith(
        'test-app-token',
        'test-number-record-table-id',
        recordId,
        {
          participant_summary: updateData.participant_summary,
        },
      );
      expect(result).toEqual(mockUpdateResult);
    });
  });
});
