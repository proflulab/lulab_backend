import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { EmailQueueService } from './email-queue.service';
import { JobType } from '../types';

describe('EmailQueueService', () => {
  let service: EmailQueueService;
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
        EmailQueueService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<EmailQueueService>(EmailQueueService);
    configService = module.get<ConfigService>(ConfigService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send verification email', async () => {
    const mockAdd = jest.fn().mockResolvedValue({ id: 'email-job-123' });
    (service as any).queue = { add: mockAdd };

    const result = await service.sendVerificationEmail('test@example.com', {
      verificationCode: '123456',
    });

    expect(mockAdd).toHaveBeenCalledWith(
      JobType.SEND_VERIFICATION_EMAIL,
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Email Verification Required',
        template: 'verification',
        templateData: { verificationCode: '123456' },
        idempotencyKey: expect.any(String),
        correlationId: expect.any(String),
        createdAt: expect.any(Date),
        priority: 'high',
      }),
      expect.objectContaining({
        priority: 10, // high priority maps to 10
        jobId: expect.any(String),
      }),
    );
    expect(result).toEqual({ id: 'email-job-123' });
  });

  it('should send password reset email', async () => {
    const mockAdd = jest.fn().mockResolvedValue({ id: 'reset-job-123' });
    (service as any).queue = { add: mockAdd };

    const result = await service.sendPasswordResetEmail('test@example.com', {
      resetToken: 'reset-token-123',
      resetUrl: 'https://example.com/reset?token=reset-token-123',
    });

    expect(mockAdd).toHaveBeenCalledWith(
      JobType.SEND_PASSWORD_RESET_EMAIL,
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Password Reset Request',
        template: 'password-reset',
        priority: 'high',
      }),
      expect.objectContaining({
        priority: 10,
      }),
    );
    expect(result).toEqual({ id: 'reset-job-123' });
  });

  it('should send notification email', async () => {
    const mockAddBulkJobs = jest
      .fn()
      .mockResolvedValue([{ id: 'notification-job-123' }]);
    (service as any).addBulkJobs = mockAddBulkJobs;

    const result = await service.sendNotificationEmail(
      'test@example.com',
      'Test Subject',
      'test-template',
      { message: 'Hello World' },
      { priority: 'normal' },
    );

    expect(mockAddBulkJobs).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: JobType.SEND_NOTIFICATION_EMAIL,
          data: expect.objectContaining({
            to: 'test@example.com',
            subject: 'Test Subject',
            template: 'test-template',
            templateData: { message: 'Hello World' },
            priority: 'normal',
          }),
          opts: expect.objectContaining({
            priority: 5, // normal priority maps to 5
          }),
        }),
      ]),
    );
    expect(result).toEqual([{ id: 'notification-job-123' }]);
  });

  // Note: Redis not ready scenario is handled at the queue initialization level
  // When Redis is not ready, the queue is not created, but the service can still
  // be instantiated without errors. The actual job processing would fail gracefully.

  it('should map priority values correctly', () => {
    const getPriorityValue = (service as any).getPriorityValue.bind(service);

    expect(getPriorityValue('high')).toBe(10);
    expect(getPriorityValue('normal')).toBe(5);
    expect(getPriorityValue('low')).toBe(1);
  });
});
