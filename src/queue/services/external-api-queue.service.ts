import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { BaseQueueService } from './base-queue.service';
import {
  QueueName,
  JobType,
  ExternalApiJobData,
  QueueJobOptions,
} from '../types';
import { randomUUID } from 'crypto';

/**
 * External API integration queue service
 */
@Injectable()
export class ExternalApiQueueService extends BaseQueueService {
  constructor(configService: ConfigService, redisService: RedisService) {
    super(configService, redisService, QueueName.EXTERNAL_API);
  }

  /**
   * Add upload recording job
   */
  async addUploadRecordingJob(
    uploadData: {
      fileUrl: string;
      fileName: string;
      meetingId: string;
      storageProvider: 'aws' | 'aliyun' | 'tencent';
    },
    options?: {
      userId?: string;
      priority?: number;
      maxRetries?: number;
    },
  ) {
    const jobData: ExternalApiJobData = {
      idempotencyKey: `upload-${uploadData.meetingId}-${uploadData.fileName}`,
      userId: options?.userId,
      correlationId: randomUUID(),
      createdAt: new Date(),
      service: 'upload',
      action: 'upload-recording',
      payload: uploadData,
      retryConfig: {
        maxAttempts: options?.maxRetries || 5,
        backoffDelay: 10000,
      },
    };

    const jobOptions: QueueJobOptions = {
      priority: options?.priority || 1,
      attempts: options?.maxRetries || 5,
      backoff: { type: 'exponential', delay: 10000 },
    };

    return this.addJob(JobType.UPLOAD_RECORDING, jobData, jobOptions);
  }

  /**
   * Add Tencent Meeting sync job
   */
  async addTencentMeetingSyncJob(
    syncData: {
      meetingId: string;
      action: 'create' | 'update' | 'delete' | 'fetch';
      meetingData?: any;
    },
    options?: {
      userId?: string;
      priority?: number;
      correlationId?: string;
    },
  ) {
    const jobData: ExternalApiJobData = {
      idempotencyKey:
        options?.correlationId ||
        `tencent-${syncData.meetingId}-${syncData.action}-${Date.now()}`,
      userId: options?.userId,
      correlationId: options?.correlationId || randomUUID(),
      createdAt: new Date(),
      service: 'tencent-meeting',
      action: syncData.action,
      payload: syncData,
    };

    const jobOptions: QueueJobOptions = {
      priority: options?.priority || 3,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    };

    return this.addJob(JobType.SYNC_TENCENT_MEETING, jobData, jobOptions);
  }

  /**
   * Add Lark Bitable sync job
   */
  async addLarkBitableSyncJob(
    syncData: {
      appId: string;
      tableId: string;
      recordId?: string;
      action: 'create' | 'update' | 'delete' | 'batch-create' | 'batch-update';
      data: any;
    },
    options?: {
      userId?: string;
      priority?: number;
      correlationId?: string;
    },
  ) {
    const jobData: ExternalApiJobData = {
      idempotencyKey:
        options?.correlationId ||
        `lark-${syncData.appId}-${syncData.tableId}-${syncData.action}-${Date.now()}`,
      userId: options?.userId,
      correlationId: options?.correlationId || randomUUID(),
      createdAt: new Date(),
      service: 'lark',
      action: syncData.action,
      payload: syncData,
    };

    const jobOptions: QueueJobOptions = {
      priority: options?.priority || 3,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    };

    return this.addJob(JobType.SYNC_LARK_BITABLE, jobData, jobOptions);
  }

  /**
   * Add SMS sending job
   */
  async addSendSmsJob(
    smsData: {
      phoneNumber: string;
      message: string;
      templateCode?: string;
      templateParams?: Record<string, string>;
    },
    options?: {
      userId?: string;
      priority?: number;
      delay?: number;
    },
  ) {
    const jobData: ExternalApiJobData = {
      idempotencyKey: `sms-${smsData.phoneNumber}-${Date.now()}`,
      userId: options?.userId,
      correlationId: randomUUID(),
      createdAt: new Date(),
      service: 'aliyun-sms',
      action: 'send-sms',
      payload: smsData,
    };

    const jobOptions: QueueJobOptions = {
      priority: options?.priority || 8,
      delay: options?.delay,
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
    };

    return this.addJob(JobType.SEND_SMS, jobData, jobOptions);
  }

  /**
   * Add bulk external API jobs
   */
  async addBulkApiJobs(
    jobs: Array<{
      service: 'tencent-meeting' | 'lark' | 'aliyun-sms' | 'upload';
      action: string;
      payload: any;
      options?: {
        userId?: string;
        priority?: number;
        maxRetries?: number;
      };
    }>,
  ) {
    const jobsToAdd = jobs.map((job) => {
      const jobType = this.getJobTypeForService(job.service, job.action);
      const jobData: ExternalApiJobData = {
        idempotencyKey: `${job.service}-${job.action}-${Date.now()}-${Math.random()}`,
        userId: job.options?.userId,
        correlationId: randomUUID(),
        createdAt: new Date(),
        service: job.service,
        action: job.action,
        payload: job.payload,
      };

      return {
        name: jobType,
        data: jobData,
        opts: {
          priority: job.options?.priority || 1,
          attempts: job.options?.maxRetries || 3,
        },
      };
    });

    return this.addBulkJobs(jobsToAdd);
  }

  /**
   * Add webhook processing job
   */
  async addWebhookProcessingJob(
    webhookData: {
      source: 'tencent-meeting' | 'lark' | 'other';
      eventType: string;
      payload: any;
      signature?: string;
    },
    options?: {
      userId?: string;
      priority?: number;
    },
  ) {
    const jobData: ExternalApiJobData = {
      idempotencyKey: `webhook-${webhookData.source}-${webhookData.eventType}-${Date.now()}`,
      userId: options?.userId,
      correlationId: randomUUID(),
      createdAt: new Date(),
      service:
        webhookData.source === 'other' ? 'tencent-meeting' : webhookData.source,
      action: 'process-webhook',
      payload: webhookData,
    };

    const jobOptions: QueueJobOptions = {
      priority: options?.priority || 5,
      attempts: 2,
      backoff: { type: 'fixed', delay: 2000 },
    };

    const jobType =
      webhookData.source === 'tencent-meeting'
        ? JobType.SYNC_TENCENT_MEETING
        : JobType.SYNC_LARK_BITABLE;

    return this.addJob(jobType, jobData, jobOptions);
  }

  /**
   * Schedule recurring API sync
   */
  async scheduleRecurringApiSync(
    service: 'tencent-meeting' | 'lark' | 'aliyun-sms',
    action: string,
    payload: any,
    cronExpression: string,
    options?: {
      userId?: string;
      priority?: number;
    },
  ) {
    const jobData: ExternalApiJobData = {
      idempotencyKey: `recurring-${service}-${action}`,
      userId: options?.userId,
      correlationId: randomUUID(),
      createdAt: new Date(),
      service,
      action,
      payload,
    };

    const jobType = this.getJobTypeForService(service, action);
    return this.addJob(jobType, jobData, {
      priority: options?.priority || 1,
      repeat: { pattern: cronExpression },
    });
  }

  /**
   * Get job type for service and action
   */
  private getJobTypeForService(
    service: 'tencent-meeting' | 'lark' | 'aliyun-sms' | 'upload',
    action: string,
  ): JobType {
    switch (service) {
      case 'upload':
        return JobType.UPLOAD_RECORDING;
      case 'tencent-meeting':
        return JobType.SYNC_TENCENT_MEETING;
      case 'lark':
        return JobType.SYNC_LARK_BITABLE;
      case 'aliyun-sms':
        return JobType.SEND_SMS;
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }
}
