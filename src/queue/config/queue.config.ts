import { ConfigService } from '@nestjs/config';
import { ConnectionOptions } from 'bullmq';

/**
 * Queue configuration interface
 */
export interface QueueConfig {
  connection: ConnectionOptions;
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
  };
  concurrency: {
    default: number;
    email: number;
    meeting: number;
    externalApi: number;
  };
}

/**
 * Create Redis connection options for BullMQ
 */
export function createQueueConnectionOptions(
  configService: ConfigService,
): ConnectionOptions {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (redisUrl && redisUrl.startsWith('redis://')) {
    try {
      return {
        host: new URL(redisUrl).hostname,
        port: parseInt(new URL(redisUrl).port) || 6379,
        password: new URL(redisUrl).password || undefined,
        db: parseInt(new URL(redisUrl).pathname.slice(1)) || 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
      };
    } catch (error) {
      // Fall back to individual config if URL parsing fails
    }
  }

  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD'),
    db: configService.get<number>('REDIS_DB', 0),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  };
}

/**
 * Get queue configuration
 */
export function getQueueConfig(configService: ConfigService): QueueConfig {
  return {
    connection: createQueueConnectionOptions(configService),
    defaultJobOptions: {
      removeOnComplete: configService.get<number>(
        'QUEUE_REMOVE_ON_COMPLETE',
        50,
      ),
      removeOnFail: configService.get<number>('QUEUE_REMOVE_ON_FAIL', 20),
      attempts: configService.get<number>('QUEUE_DEFAULT_ATTEMPTS', 3),
      backoff: {
        type: 'exponential',
        delay: configService.get<number>('QUEUE_BACKOFF_DELAY', 5000),
      },
    },
    concurrency: {
      default: configService.get<number>('QUEUE_CONCURRENCY_DEFAULT', 1),
      email: configService.get<number>('QUEUE_CONCURRENCY_EMAIL', 2),
      meeting: configService.get<number>('QUEUE_CONCURRENCY_MEETING', 1),
      externalApi: configService.get<number>(
        'QUEUE_CONCURRENCY_EXTERNAL_API',
        1,
      ),
    },
  };
}

/**
 * Environment-specific queue settings
 */
export const QUEUE_SETTINGS = {
  development: {
    concurrency: { default: 1, email: 1, meeting: 1, externalApi: 1 },
    jobRetention: { completed: 10, failed: 5 },
  },
  production: {
    concurrency: { default: 2, email: 3, meeting: 2, externalApi: 2 },
    jobRetention: { completed: 100, failed: 50 },
  },
  test: {
    concurrency: { default: 1, email: 1, meeting: 1, externalApi: 1 },
    jobRetention: { completed: 1, failed: 1 },
  },
};
