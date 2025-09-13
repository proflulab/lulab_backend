import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TencentApiService } from './tencent-api.service';

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      TENCENT_MEETING_SECRET_ID: 'mock-secret-id',
      TENCENT_MEETING_SECRET_KEY: 'mock-secret-key',
      TENCENT_MEETING_APP_ID: 'mock-app-id',
      TENCENT_MEETING_SDK_ID: 'mock-sdk-id',
      USER_ID: 'mock-user-id',
    };
    return config[key];
  }),
};

global.fetch = jest.fn();

jest.mock('./crypto.util', () => ({
  generateSignature: jest.fn(() => 'mock-signature'),
}));

const jsonResponse = (data: unknown) => ({
  json: jest.fn().mockResolvedValueOnce(data),
});

describe('TencentApiService', () => {
  let service: TencentApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TencentApiService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TencentApiService>(TencentApiService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('returns correct config', () => {
      const config = (service as any).getConfig();
      expect(config).toEqual({
        secretId: 'mock-secret-id',
        secretKey: 'mock-secret-key',
        appId: 'mock-app-id',
        sdkId: 'mock-sdk-id',
        userId: 'mock-user-id',
      });
    });
  });

  describe('getRecordingFileDetail', () => {
    it('should return recording details successfully', async () => {
      const mockResponse = {
        record_file_id: 'test-file-id',
        meeting_id: 'test-meeting-id',
        meeting_code: '123456789',
        subject: 'Test Meeting',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(mockResponse));

      const result = await service.getRecordingFileDetail('test-file-id', 'test-user-id');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/addresses/test-file-id'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-TC-Key': 'mock-secret-id',
            'X-TC-Signature': 'mock-signature',
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockError = { error_info: { error_code: 108004051, message: '录制文件已经被删除' } };
      (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(mockError));
      await expect(service.getRecordingFileDetail('deleted-file-id', 'test-user-id')).rejects.toThrow('录制文件已经被删除');
    });

    it('should handle IP whitelist error', async () => {
      const mockError = { error_info: { error_code: 500125, message: 'IP未在白名单' } };
      (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(mockError));
      await expect(service.getRecordingFileDetail('test-file-id', 'test-user-id')).rejects.toThrow('IP白名单错误');
    });
  });

  describe('getCorpRecords', () => {
    it('returns meeting records', async () => {
      const mockResponse = { total_count: 2, current_page: 1, total_page: 1, record_meetings: [] };
      (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(mockResponse));

      const startTime = Math.floor(new Date('2024-01-01').getTime() / 1000);
      const endTime = Math.floor(new Date('2024-01-31').getTime() / 1000);
      const result = await service.getCorpRecords(startTime, endTime, 10, 1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/corp/records'),
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('validates time range (max 31 days)', async () => {
      const startTime = Math.floor(new Date('2024-01-01').getTime() / 1000);
      const endTime = Math.floor(new Date('2024-02-15').getTime() / 1000);
      await expect(service.getCorpRecords(startTime, endTime)).rejects.toThrow('时间区间不允许超过31天');
    });

    it('limits page size to max 20', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ total_count: 0, record_meetings: [] }));
      const startTime = Math.floor(new Date('2024-01-01').getTime() / 1000);
      const endTime = Math.floor(new Date('2024-01-02').getTime() / 1000);
      await service.getCorpRecords(startTime, endTime, 50, 1);
      const fetchCall = String((global.fetch as jest.Mock).mock.calls[0][0]);
      expect(fetchCall).toContain('page_size=20');
    });
  });
});

