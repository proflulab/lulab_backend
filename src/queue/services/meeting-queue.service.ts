import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { BaseQueueService } from './base-queue.service';
import {
  QueueName,
  JobType,
  MeetingProcessingJobData,
  QueueJobOptions,
} from '../types';
import { randomUUID } from 'crypto';

/**
 * Meeting processing queue service
 */
@Injectable()
export class MeetingQueueService extends BaseQueueService {
  constructor(configService: ConfigService, redisService: RedisService) {
    super(configService, redisService, QueueName.MEETING_PROCESSING);
  }

  /**
   * Add a meeting processing job
   */
  async addProcessJob(
    meetingId: string,
    action: 'process' | 'analyze' | 'sync',
    payload: {
      meetingData?: any;
      analysisType?: string;
      syncTarget?: string;
    },
    options?: {
      userId?: string;
      correlationId?: string;
      metadata?: Record<string, any>;
      jobOptions?: QueueJobOptions;
    },
  ) {
    const jobData: MeetingProcessingJobData = {
      idempotencyKey:
        options?.correlationId || `${meetingId}-${action}-${Date.now()}`,
      userId: options?.userId,
      correlationId: options?.correlationId || randomUUID(),
      metadata: options?.metadata,
      createdAt: new Date(),
      meetingId,
      action,
      payload,
    };

    const jobType = this.getJobTypeForAction(action);
    return this.addJob(jobType, jobData, options?.jobOptions);
  }

  /**
   * Add meeting analysis job
   */
  async addAnalysisJob(
    meetingId: string,
    analysisType: string,
    meetingData: any,
    options?: {
      userId?: string;
      priority?: number;
      delay?: number;
    },
  ) {
    return this.addProcessJob(
      meetingId,
      'analyze',
      { meetingData, analysisType },
      {
        ...options,
        jobOptions: {
          priority: options?.priority || 3,
          delay: options?.delay,
        },
      },
    );
  }

  /**
   * Add meeting sync job
   */
  async addSyncJob(
    meetingId: string,
    syncTarget: string,
    meetingData: any,
    options?: {
      userId?: string;
      maxRetries?: number;
    },
  ) {
    return this.addProcessJob(
      meetingId,
      'sync',
      { meetingData, syncTarget },
      {
        ...options,
        jobOptions: {
          attempts: options?.maxRetries || 5,
          backoff: { type: 'exponential', delay: 5000 },
        },
      },
    );
  }

  /**
   * Add bulk meeting processing jobs
   */
  async addBulkProcessJobs(
    jobs: Array<{
      meetingId: string;
      action: 'process' | 'analyze' | 'sync';
      payload: any;
      options?: {
        userId?: string;
        priority?: number;
      };
    }>,
  ) {
    const jobsToAdd = jobs.map((job) => ({
      name: this.getJobTypeForAction(job.action),
      data: {
        idempotencyKey: `${job.meetingId}-${job.action}-${Date.now()}`,
        userId: job.options?.userId,
        correlationId: randomUUID(),
        createdAt: new Date(),
        meetingId: job.meetingId,
        action: job.action,
        payload: job.payload,
      } as MeetingProcessingJobData,
      opts: {
        priority: job.options?.priority || 1,
      },
    }));

    return this.addBulkJobs(jobsToAdd);
  }

  /**
   * Schedule recurring meeting processing
   */
  async scheduleRecurringProcessing(
    meetingId: string,
    cronExpression: string,
    action: 'process' | 'analyze' | 'sync',
    payload: any,
  ) {
    const jobData: MeetingProcessingJobData = {
      idempotencyKey: `recurring-${meetingId}-${action}`,
      correlationId: randomUUID(),
      createdAt: new Date(),
      meetingId,
      action,
      payload,
    };

    const jobType = this.getJobTypeForAction(action);
    return this.addJob(jobType, jobData, {
      repeat: { pattern: cronExpression },
    });
  }

  /**
   * Get job type for action
   */
  private getJobTypeForAction(action: 'process' | 'analyze' | 'sync'): JobType {
    switch (action) {
      case 'process':
        return JobType.PROCESS_MEETING_RECORD;
      case 'analyze':
        return JobType.ANALYZE_MEETING_CONTENT;
      case 'sync':
        return JobType.SYNC_MEETING_DATA;
      default:
        throw new Error(`Unknown meeting action: ${action}`);
    }
  }
}
