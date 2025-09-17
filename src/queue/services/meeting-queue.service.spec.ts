import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { MeetingQueueService } from './meeting-queue.service';
import { JobType } from '../types';

describe('MeetingQueueService', () => {
  let service: MeetingQueueService;
  let configService: ConfigService;
  let redisService: RedisService;

  const mockRedisService = {
    isReady: jest.fn(() => true),
    getClient: jest.fn(() => ({
      exists: jest.fn(() => Promise.resolve(0)),
      setex: jest.fn(() => Promise.resolve('OK')),
      get: jest.fn(() => Promise.resolve(null)),
    })),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_PASSWORD: undefined,
        REDIS_DB: 0,
        REDIS_URL: undefined,
        QUEUE_REMOVE_ON_COMPLETE: 50,
        QUEUE_REMOVE_ON_FAIL: 20,
        QUEUE_DEFAULT_ATTEMPTS: 3,
        QUEUE_BACKOFF_DELAY: 5000,
        QUEUE_CONCURRENCY_DEFAULT: 1,
        QUEUE_CONCURRENCY_EMAIL: 2,
        QUEUE_CONCURRENCY_MEETING: 1,
        QUEUE_CONCURRENCY_EXTERNAL_API: 1,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingQueueService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<MeetingQueueService>(MeetingQueueService);
    configService = module.get<ConfigService>(ConfigService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add process job', async () => {
    const mockAdd = jest.fn().mockResolvedValue({ id: 'job-123' });
    (service as any).queue = { add: mockAdd };

    const result = await service.addProcessJob('meeting-1', 'process', {
      meetingData: { title: 'Test Meeting' },
    });

    expect(mockAdd).toHaveBeenCalledWith(
      JobType.PROCESS_MEETING_RECORD,
      expect.objectContaining({
        meetingId: 'meeting-1',
        action: 'process',
        payload: { meetingData: { title: 'Test Meeting' } },
        idempotencyKey: expect.any(String),
        correlationId: expect.any(String),
        createdAt: expect.any(Date),
      }),
      expect.objectContaining({
        jobId: expect.any(String),
      }),
    );
    expect(result).toEqual({ id: 'job-123' });
  });

  it('should add analysis job', async () => {
    const mockAdd = jest.fn().mockResolvedValue({ id: 'analysis-job-123' });
    (service as any).queue = { add: mockAdd };

    const result = await service.addAnalysisJob(
      'meeting-1',
      'sentiment',
      { transcript: 'Test transcript' },
      { priority: 5 },
    );

    expect(mockAdd).toHaveBeenCalledWith(
      JobType.ANALYZE_MEETING_CONTENT,
      expect.objectContaining({
        meetingId: 'meeting-1',
        action: 'analyze',
        payload: {
          meetingData: { transcript: 'Test transcript' },
          analysisType: 'sentiment',
        },
      }),
      expect.objectContaining({
        priority: 5,
      }),
    );
    expect(result).toEqual({ id: 'analysis-job-123' });
  });

  it('should add sync job', async () => {
    const mockAdd = jest.fn().mockResolvedValue({ id: 'sync-job-123' });
    (service as any).queue = { add: mockAdd };

    const result = await service.addSyncJob(
      'meeting-1',
      'lark-bitable',
      { title: 'Test Meeting' },
      { maxRetries: 3 },
    );

    expect(mockAdd).toHaveBeenCalledWith(
      JobType.SYNC_MEETING_DATA,
      expect.objectContaining({
        meetingId: 'meeting-1',
        action: 'sync',
        payload: {
          meetingData: { title: 'Test Meeting' },
          syncTarget: 'lark-bitable',
        },
      }),
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }),
    );
    expect(result).toEqual({ id: 'sync-job-123' });
  });

  // Note: Redis not ready scenario is handled at the queue initialization level
  // When Redis is not ready, the queue is not created, but the service can still
  // be instantiated without errors. The actual job processing would fail gracefully.

  it('should get correct job type for action', () => {
    const getJobTypeForAction = (service as any).getJobTypeForAction.bind(
      service,
    );

    expect(getJobTypeForAction('process')).toBe(JobType.PROCESS_MEETING_RECORD);
    expect(getJobTypeForAction('analyze')).toBe(
      JobType.ANALYZE_MEETING_CONTENT,
    );
    expect(getJobTypeForAction('sync')).toBe(JobType.SYNC_MEETING_DATA);
  });

  it('should throw error for unknown action', () => {
    const getJobTypeForAction = (service as any).getJobTypeForAction.bind(
      service,
    );

    expect(() => getJobTypeForAction('unknown')).toThrow(
      'Unknown meeting action: unknown',
    );
  });
});
