import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TencentApiService } from './tencent-api.service';

// 模拟 ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      TENCENT_MEETING_SECRET_ID: 'mock-secret-id',
      TENCENT_MEETING_SECRET_KEY: 'mock-secret-key',
      TENCENT_MEETING_APP_ID: 'mock-app-id',
      TENCENT_MEETING_SDK_ID: 'mock-sdk-id',
      USER_ID: 'mock-user-id',
    };
    return config[key];
  }),
};

// 模拟 fetch
global.fetch = jest.fn();

// 模拟 tencent-crypto.service
jest.mock('./tencent-crypto.service', () => ({
  generateSignature: jest.fn(() => 'mock-signature'),
}));

describe('TencentApiService', () => {
  let service: TencentApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TencentApiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TencentApiService>(TencentApiService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return correct configuration', () => {
      const config = service['getConfig']();
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
        record_start_time: '2024-01-01T10:00:00Z',
        record_end_time: '2024-01-01T11:00:00Z',
        record_size: 1024000,
        download_address: 'https://example.com/recording.mp4',
        view_address: 'https://example.com/view',
        meeting_type: 0,
        record_file_type: 1,
        record_state: 1,
        record_user_id: 'test-user',
        record_user_open_id: 'test-open-id',
        media_start_time: '2024-01-01T10:00:00Z',
        media_end_time: '2024-01-01T11:00:00Z',
        record_privilege: 1,
        record_files: [],
        summary: {
          ai_summary: 'Test summary',
          ai_summary_type: 1,
          ai_summary_files: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await service.getRecordingFileDetail(
        'test-file-id',
        'test-user-id',
      );

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
      const mockError = {
        error_info: {
          error_code: 108004051,
          message: '录制文件已经被删除',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockError),
      });

      await expect(
        service.getRecordingFileDetail('deleted-file-id', 'test-user-id'),
      ).rejects.toThrow('录制文件已经被删除');
    });

    it('should handle IP whitelist error', async () => {
      const mockError = {
        error_info: {
          error_code: 500125,
          message: 'IP未在白名单',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockError),
      });

      await expect(
        service.getRecordingFileDetail('test-file-id', 'test-user-id'),
      ).rejects.toThrow('IP白名单错误');
    });
  });

  describe('getCorpRecords', () => {
    it('should return meeting records successfully', async () => {
      const mockResponse = {
        total_count: 2,
        current_page: 1,
        total_page: 1,
        record_meetings: [
          {
            meeting_id: 'meeting-1',
            subject: 'Test Meeting 1',
            start_time: '2024-01-01T10:00:00Z',
            end_time: '2024-01-01T11:00:00Z',
          },
          {
            meeting_id: 'meeting-2',
            subject: 'Test Meeting 2',
            start_time: '2024-01-02T10:00:00Z',
            end_time: '2024-01-02T11:00:00Z',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const startTime = Math.floor(new Date('2024-01-01').getTime() / 1000);
      const endTime = Math.floor(new Date('2024-01-31').getTime() / 1000);

      const result = await service.getCorpRecords(startTime, endTime, 10, 1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/corp/records'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-TC-Key': 'mock-secret-id',
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should validate time range (max 31 days)', async () => {
      const startTime = Math.floor(new Date('2024-01-01').getTime() / 1000);
      const endTime = Math.floor(new Date('2024-02-15').getTime() / 1000); // 超过31天

      await expect(service.getCorpRecords(startTime, endTime)).rejects.toThrow(
        '时间区间不允许超过31天',
      );
    });

    it('should limit page size to maximum 20', async () => {
      const mockResponse = { total_count: 0, record_meetings: [] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const startTime = Math.floor(new Date('2024-01-01').getTime() / 1000);
      const endTime = Math.floor(new Date('2024-01-02').getTime() / 1000);

      await service.getCorpRecords(startTime, endTime, 50, 1);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('page_size=20'); // 应该被限制为20
    });
  });

  describe('getMeetingDetail', () => {
    it('should return meeting details successfully', async () => {
      const mockResponse = {
        meeting_id: 'test-meeting-id',
        subject: 'Test Meeting',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T11:00:00Z',
        duration: 3600,
        participants: ['user1', 'user2'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await service.getMeetingDetail(
        'test-meeting-id',
        'test-user-id',
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/meetings/test-meeting-id'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-TC-Key': 'mock-secret-id',
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include instanceId parameter when provided', async () => {
      const mockResponse = { meeting_id: 'test-meeting-id' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      await service.getMeetingDetail('test-meeting-id', 'test-user-id', '2');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('instanceid=2');
    });
  });

  describe('getMeetingParticipants', () => {
    it('should return participants list successfully', async () => {
      const mockResponse = {
        participants: [
          {
            userid: 'user1',
            username: 'User One',
            join_time: '2024-01-01T10:05:00Z',
            leave_time: '2024-01-01T10:55:00Z',
          },
          {
            userid: 'user2',
            username: 'User Two',
            join_time: '2024-01-01T10:10:00Z',
            leave_time: '2024-01-01T10:50:00Z',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await service.getMeetingParticipants(
        'test-meeting-id',
        'test-user-id',
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/meetings/test-meeting-id/participants'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-TC-Key': 'mock-secret-id',
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include subMeetingId parameter when provided', async () => {
      const mockResponse = { participants: [] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      await service.getMeetingParticipants(
        'test-meeting-id',
        'test-user-id',
        'sub-123',
      );

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('sub_meeting_id=sub-123');
    });

    it('should handle null subMeetingId parameter', async () => {
      const mockResponse = { participants: [] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      await service.getMeetingParticipants(
        'test-meeting-id',
        'test-user-id',
        null,
      );

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).not.toContain('sub_meeting_id');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error'),
      );

      await expect(
        service.getRecordingFileDetail('test-file-id', 'test-user-id'),
      ).rejects.toThrow('Network error');
    });

    it('should handle unexpected response format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest
          .fn()
          .mockResolvedValueOnce({ some_unexpected_field: 'value' }),
      });

      const result = await service.getRecordingFileDetail(
        'test-file-id',
        'test-user-id',
      );
      expect(result).toEqual({ some_unexpected_field: 'value' });
    });
  });
});
