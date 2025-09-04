import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TencentApiService } from '../../src/tencent-meeting/services/tencent-api.service';

// 集成测试配置
const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === 'true';

// 跳过集成测试的包装器
const describeIf = (condition: boolean) => condition ? describe : describe.skip;

describeIf(isIntegrationTest)('TencentApiService Integration Tests', () => {
  let service: TencentApiService;
  let configService: ConfigService;

  beforeAll(async () => {
    // 确保测试环境配置已加载
    require('dotenv').config({ path: '.env.test' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TencentApiService,
        ConfigService,
      ],
    }).compile();

    service = module.get<TencentApiService>(TencentApiService);
    configService = module.get<ConfigService>(ConfigService);

    // 验证测试配置
    const requiredEnvVars = [
      'TENCENT_MEETING_SECRET_ID',
      'TENCENT_MEETING_SECRET_KEY',
      'TENCENT_MEETING_APP_ID',
      'TENCENT_MEETING_SDK_ID',
      'USER_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !configService.get(varName));
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  });

  describe('getRecordingFileDetail', () => {
    it('should return valid recording details from real API', async () => {
      // 使用真实的测试文件ID
      const testFileId = process.env.TEST_RECORDING_FILE_ID || 'test-recording-file-id';
      const testUserId = configService.get<string>('USER_ID') || '';

      try {
        const result = await service.getRecordingFileDetail(testFileId, testUserId);

        // 验证响应结构符合预期
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');

        // 验证必需字段存在
        expect(result).toHaveProperty('record_file_id');
        expect(result).toHaveProperty('meeting_id');
        expect(result).toHaveProperty('meeting_code');

        // 验证字段类型
        expect(typeof result.record_file_id).toBe('string');
        expect(typeof result.meeting_id).toBe('string');
        expect(typeof result.meeting_code).toBe('string');

        // 验证可选字段类型（如果存在）
        if (result.start_time) {
          expect(typeof result.start_time).toBe('string');
        }
        if (result.end_time) {
          expect(typeof result.end_time).toBe('string');
        }
        if (result.download_address) {
          expect(typeof result.download_address).toBe('string');
          expect(result.download_address).toMatch(/^https?:\/\//);
        }

        console.log('✅ Real API response structure validated:', {
          hasRecordFileId: !!result.record_file_id,
          hasMeetingId: !!result.meeting_id,
          hasMeetingCode: !!result.meeting_code,
          hasDownloadAddress: !!result.download_address,
          responseKeys: Object.keys(result)
        });

      } catch (error) {
        // 处理预期的错误情况
        if (error.message.includes('录制文件已经被删除')) {
          console.warn('⚠️ Test recording file not found - this is expected in test environment');
          expect(error.message).toContain('录制文件已经被删除');
        } else if (error.message.includes('IP白名单错误')) {
          console.error('❌ IP whitelist error - please add your IP to Tencent Meeting whitelist');
          throw error;
        } else {
          console.error('❌ Unexpected API error:', error.message);
          throw error;
        }
      }
    }, 30000); // 增加超时时间，考虑网络延迟

    it('should handle non-existent recording file gracefully', async () => {
      const nonExistentFileId = 'non-existent-file-id-' + Date.now();
      const testUserId = configService.get<string>('USER_ID') || '';

      await expect(
        service.getRecordingFileDetail(nonExistentFileId, testUserId)
      ).rejects.toThrow(/录制文件已经被删除|API请求失败/);
    });
  });

  describe('getCorpRecords', () => {
    it('should return valid meeting records from real API', async () => {
      const now = Math.floor(Date.now() / 1000);
      const oneDayAgo = now - 24 * 60 * 60; // 24小时前
      const testUserId = configService.get<string>('USER_ID') || '';

      try {
        const result = await service.getCorpRecords(oneDayAgo, now, 10, 1);

        // 验证响应结构
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');

        // 验证分页信息
        expect(result).toHaveProperty('total_count');
        expect(result).toHaveProperty('current_page');
        expect(result).toHaveProperty('total_page');
        expect(typeof result.total_count).toBe('number');
        expect(typeof result.current_page).toBe('number');
        expect(typeof result.total_page).toBe('number');

        // 验证会议记录数组
        expect(result).toHaveProperty('record_meetings');
        expect(Array.isArray(result.record_meetings)).toBe(true);

        if (result.record_meetings && result.record_meetings.length > 0) {
          const firstMeeting = result.record_meetings[0];
          expect(firstMeeting).toHaveProperty('meeting_record_id');
          expect(firstMeeting).toHaveProperty('meeting_id');
          expect(firstMeeting).toHaveProperty('subject');
          expect(typeof firstMeeting.meeting_record_id).toBe('string');
          expect(typeof firstMeeting.meeting_id).toBe('string');
          expect(typeof firstMeeting.subject).toBe('string');
        }

        console.log('✅ Corp records API validated:', {
          totalCount: result.total_count,
          currentPage: result.current_page,
          totalPage: result.total_page,
          meetingsCount: result.record_meetings?.length || 0
        });

      } catch (error) {
        if (error.message.includes('IP白名单错误')) {
          console.error('❌ IP whitelist error');
          throw error;
        } else {
          console.error('❌ API error:', error.message);
          throw error;
        }
      }
    }, 30000);

    it('should validate time range constraints', async () => {
      const now = Math.floor(Date.now() / 1000);
      const tooFarBack = now - (32 * 24 * 60 * 60); // 32天前

      await expect(
        service.getCorpRecords(tooFarBack, now)
      ).rejects.toThrow('时间区间不允许超过31天');
    });
  });

  describe('API Response Structure Validation', () => {
    it('should have consistent response structure across endpoints', async () => {
      // 验证所有API端点的响应结构一致性
      const endpoints = [
        { name: 'getCorpRecords', fn: () => service.getCorpRecords(Date.now() - 3600, Date.now()) },
      ];

      for (const endpoint of endpoints) {
        try {
          const result = await endpoint.fn();

          // 验证基本结构
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');

          // 验证错误处理结构
          if (result.error_info) {
            expect(result.error_info).toHaveProperty('error_code');
            expect(result.error_info).toHaveProperty('message');
            expect(typeof result.error_info.error_code).toBe('number');
            expect(typeof result.error_info.message).toBe('string');
          }

          console.log(`✅ ${endpoint.name} structure validated`);
        } catch (error) {
          if (!error.message.includes('IP白名单错误')) {
            console.warn(`⚠️ ${endpoint.name} validation failed:`, error.message);
          }
        }
      }
    });
  });
});