import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Job } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import {
  QueueName,
  JobType,
  BaseJobData,
  QueueJobOptions,
  DEFAULT_JOB_OPTIONS,
  JobResult,
} from '../types';
import { getQueueConfig } from '../config/queue.config';

/**
 * Base queue service providing common queue operations
 */
@Injectable()
export abstract class BaseQueueService {
  protected readonly logger = new Logger(this.constructor.name);
  protected queue: Queue;
  protected queueConfig: ReturnType<typeof getQueueConfig>;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly redisService: RedisService,
    protected readonly queueName: QueueName,
  ) {
    this.queueConfig = getQueueConfig(this.configService);
    this.initializeQueue();
  }

  /**
   * Initialize the queue with Redis connection
   */
  private initializeQueue(): void {
    if (!this.redisService.isReady()) {
      this.logger.warn(`Redis not ready, queue ${this.queueName} disabled`);
      return;
    }

    this.queue = new Queue(this.queueName, {
      connection: this.queueConfig.connection,
      defaultJobOptions: this.queueConfig.defaultJobOptions,
    });

    this.setupQueueEvents();
  }

  /**
   * Setup queue event listeners
   */
  private setupQueueEvents(): void {
    this.queue.on('error', (error) => {
      this.logger.error(`Queue ${this.queueName} error:`, error);
    });

    this.queue.on('waiting', (job) => {
      this.logger.debug(`Job ${job.id} is waiting in queue ${this.queueName}`);
    });

    // Note: Using QueueEvents for job lifecycle events in BullMQ v5
    // For now, we'll keep basic logging here
  }

  /**
   * Add a job to the queue with idempotency check
   */
  async addJob<T extends BaseJobData>(
    jobType: JobType,
    data: T,
    options?: QueueJobOptions,
  ): Promise<Job<T> | null> {
    if (!this.queue) {
      this.logger.warn(`Queue ${this.queueName} not initialized, skipping job`);
      return null;
    }

    try {
      // Check idempotency
      const isProcessed = await this.checkIdempotency(data.idempotencyKey);
      if (isProcessed) {
        this.logger.debug(
          `Job with idempotency key ${data.idempotencyKey} already processed`,
        );
        return null;
      }

      // Merge job options with defaults
      const jobOptions = {
        ...DEFAULT_JOB_OPTIONS[jobType],
        ...options,
        jobId: data.idempotencyKey, // Use idempotency key as job ID
      };

      // Add job to queue
      const job = await this.queue.add(jobType, data, jobOptions);

      this.logger.debug(
        `Added job ${job.id} of type ${jobType} to queue ${this.queueName}`,
      );

      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add job ${jobType} to queue ${this.queueName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Add multiple jobs as a batch
   */
  async addBulkJobs<T extends BaseJobData>(
    jobs: Array<{
      name: JobType;
      data: T;
      opts?: QueueJobOptions;
    }>,
  ): Promise<Job[]> {
    if (!this.queue) {
      this.logger.warn(
        `Queue ${this.queueName} not initialized, skipping bulk jobs`,
      );
      return [];
    }

    try {
      const jobsToAdd: Array<{
        name: string;
        data: T;
        opts: any;
      }> = [];

      for (const job of jobs) {
        const isProcessed = await this.checkIdempotency(
          job.data.idempotencyKey,
        );
        if (!isProcessed) {
          jobsToAdd.push({
            name: job.name,
            data: job.data,
            opts: {
              ...DEFAULT_JOB_OPTIONS[job.name],
              ...job.opts,
              jobId: job.data.idempotencyKey,
            },
          });
        }
      }

      if (jobsToAdd.length === 0) {
        this.logger.debug('All bulk jobs already processed (idempotency)');
        return [];
      }

      const addedJobs = await this.queue.addBulk(jobsToAdd);

      this.logger.debug(
        `Added ${addedJobs.length} bulk jobs to queue ${this.queueName}`,
      );

      return addedJobs;
    } catch (error) {
      this.logger.error(
        `Failed to add bulk jobs to queue ${this.queueName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if a job with the given idempotency key has been processed
   */
  async checkIdempotency(idempotencyKey: string): Promise<boolean> {
    if (!this.redisService.isReady()) {
      return false;
    }

    try {
      const redis = this.redisService.getClient();
      const key = `idempotency:${this.queueName}:${idempotencyKey}`;
      const exists = await redis?.exists(key);
      return !!exists;
    } catch (error) {
      this.logger.error('Failed to check idempotency:', error);
      return false;
    }
  }

  /**
   * Mark a job as processed (for idempotency)
   */
  async markAsProcessed(
    idempotencyKey: string,
    result: JobResult,
    ttlSeconds = 86400, // 24 hours default
  ): Promise<void> {
    if (!this.redisService.isReady()) {
      return;
    }

    try {
      const redis = this.redisService.getClient();
      const key = `idempotency:${this.queueName}:${idempotencyKey}`;
      await redis?.setex(key, ttlSeconds, JSON.stringify(result));
    } catch (error) {
      this.logger.error('Failed to mark job as processed:', error);
    }
  }

  /**
   * Get idempotency result
   */
  async getIdempotencyResult(
    idempotencyKey: string,
  ): Promise<JobResult | null> {
    if (!this.redisService.isReady()) {
      return null;
    }

    try {
      const redis = this.redisService.getClient();
      const key = `idempotency:${this.queueName}:${idempotencyKey}`;
      const result = await redis?.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      this.logger.error('Failed to get idempotency result:', error);
      return null;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    if (!this.queue) return null;
    const job = await this.queue.getJob(jobId);
    return job || null;
  }

  /**
   * Remove job by ID
   */
  async removeJob(jobId: string): Promise<void> {
    if (!this.queue) return;

    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.queue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      };
    }

    return this.queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );
  }

  /**
   * Pause the queue
   */
  async pauseQueue(): Promise<void> {
    if (this.queue) {
      await this.queue.pause();
      this.logger.log(`Queue ${this.queueName} paused`);
    }
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    if (this.queue) {
      await this.queue.resume();
      this.logger.log(`Queue ${this.queueName} resumed`);
    }
  }

  /**
   * Clean up completed/failed jobs
   */
  async cleanQueue(
    grace: number = 60000, // 1 minute
    limit: number = 100,
  ): Promise<void> {
    if (!this.queue) return;

    await Promise.all([
      this.queue.clean(grace, limit, 'completed'),
      this.queue.clean(grace, limit, 'failed'),
    ]);

    this.logger.log(`Cleaned queue ${this.queueName}`);
  }

  /**
   * Get queue instance
   */
  getQueue(): Queue | null {
    return this.queue;
  }

  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      this.logger.log(`Queue ${this.queueName} closed`);
    }
  }
}
