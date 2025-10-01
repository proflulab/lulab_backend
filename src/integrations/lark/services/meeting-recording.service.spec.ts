import { Test, TestingModule } from '@nestjs/testing';
import { MeetingRecordingService } from './meeting-recording.service';
import { LarkClient } from '../lark.client';

describe('MeetingRecordingService', () => {
  let service: MeetingRecordingService;
  let mockLarkClient: Partial<LarkClient>;

  beforeEach(async () => {
    mockLarkClient = {
      vc: {
        v1: {
          meetingRecording: {
            get: jest.fn().mockResolvedValue({
              code: 0,
              msg: 'success',
              data: {
                recording: {
                  url: 'https://example.com/recording.mp4',
                  duration: '3600',
                },
                recording_status: 'ready',
                recording_start_time: 1640995200000,
                recording_end_time: 1640998800000,
              },
            }),
            setPermission: jest.fn().mockResolvedValue({
              code: 0,
              msg: 'success',
              data: {
                authorized: true,
                download_url: 'https://example.com/recording.mp4',
              },
            }),
          },
        },
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingRecordingService,
        {
          provide: LarkClient,
          useValue: mockLarkClient,
        },
      ],
    }).compile();

    service = module.get<MeetingRecordingService>(MeetingRecordingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMeetingRecording', () => {
    it('should get meeting recording successfully', async () => {
      const result = await service.getMeetingRecording('test-meeting-id');
      
      expect(result.code).toBe(0);
      expect(result.msg).toBe('success');
      expect(result.data?.recording?.url).toBe('https://example.com/recording.mp4');
      expect(mockLarkClient.vc?.v1?.meetingRecording?.get).toHaveBeenCalledWith({
        path: { meeting_id: 'test-meeting-id' },
      });
    });

    it('should include user access token when provided', async () => {
      await service.getMeetingRecording('test-meeting-id', 'user-token');
      
      expect(mockLarkClient.vc?.v1?.meetingRecording?.get).toHaveBeenCalledWith({
        path: { meeting_id: 'test-meeting-id' },
        headers: { 'X-User-Access-Token': 'user-token' },
      });
    });
  });

  describe('authorizeMeetingRecording', () => {
    it('should authorize meeting recording successfully', async () => {
      const permission = { type: 'public' as const };
      const result = await service.authorizeMeetingRecording('test-meeting-id', permission);
      
      expect(result.code).toBe(0);
      expect(result.data?.authorized).toBe(true);
      expect(mockLarkClient.vc?.v1?.meetingRecording?.setPermission).toHaveBeenCalledWith({
        path: { meeting_id: 'test-meeting-id' },
        data: { permission },
      });
    });
  });

  describe('getRecordingFiles', () => {
    it('should return recording files array', async () => {
      const files = await service.getRecordingFiles('test-meeting-id');
      
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBe(1);
      expect(files[0].download_url).toBe('https://example.com/recording.mp4');
      expect(files[0].duration).toBe(3600);
    });
  });

  describe('testConnection', () => {
    it('should return true when client is properly initialized', async () => {
      const result = await service.testConnection();
      expect(result).toBe(true);
    });
  });
});