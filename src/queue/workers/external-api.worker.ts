import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, UnrecoverableError } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { BaseWorker } from './base-worker';
import { QueueName, JobType, ExternalApiJobData, JobResult } from '../types';

/**
 * External API integration worker
 */
@Injectable()
export class ExternalApiWorker extends BaseWorker<ExternalApiJobData> {
  constructor(configService: ConfigService, redisService: RedisService) {
    super(
      configService,
      redisService,
      QueueName.EXTERNAL_API,
      configService.get<number>('QUEUE_CONCURRENCY_EXTERNAL_API', 1),
    );
  }

  /**
   * Process external API jobs
   */
  protected async processJob(job: Job<ExternalApiJobData>): Promise<JobResult> {
    return this.executeJob(job, async (data) => {
      const { service, action, payload } = data;

      this.logger.log(`Processing ${service} API job with action ${action}`, {
        jobId: job.id,
        correlationId: data.correlationId,
      });

      switch (service) {
        case 'upload':
          return this.processUploadJob(action, payload);
        case 'tencent-meeting':
          return this.processTencentMeetingJob(action, payload);
        case 'lark':
          return this.processLarkJob(action, payload);
        case 'aliyun-sms':
          return this.processAliyunSmsJob(action, payload);
        default:
          throw new UnrecoverableError(`Unknown service: ${service}`);
      }
    });
  }

  /**
   * Process upload jobs
   */
  private async processUploadJob(action: string, payload: any): Promise<any> {
    try {
      this.logger.debug(`Processing upload job: ${action}`);

      switch (action) {
        case 'upload-recording':
          return this.uploadRecording(payload);
        default:
          throw new UnrecoverableError(`Unknown upload action: ${action}`);
      }
    } catch (error) {
      this.logger.error(`Upload job failed:`, error);
      throw error;
    }
  }

  /**
   * Process Tencent Meeting jobs
   */
  private async processTencentMeetingJob(
    action: string,
    payload: any,
  ): Promise<any> {
    try {
      this.logger.debug(`Processing Tencent Meeting job: ${action}`);

      switch (action) {
        case 'create':
          return this.createTencentMeeting(payload);
        case 'update':
          return this.updateTencentMeeting(payload);
        case 'delete':
          return this.deleteTencentMeeting(payload);
        case 'fetch':
          return this.fetchTencentMeeting(payload);
        case 'process-webhook':
          return this.processTencentWebhook(payload);
        default:
          throw new UnrecoverableError(
            `Unknown Tencent Meeting action: ${action}`,
          );
      }
    } catch (error) {
      this.logger.error(`Tencent Meeting job failed:`, error);
      throw error;
    }
  }

  /**
   * Process Lark Bitable jobs
   */
  private async processLarkJob(action: string, payload: any): Promise<any> {
    try {
      this.logger.debug(`Processing Lark job: ${action}`);

      switch (action) {
        case 'create':
          return this.createLarkRecord(payload);
        case 'update':
          return this.updateLarkRecord(payload);
        case 'delete':
          return this.deleteLarkRecord(payload);
        case 'batch-create':
          return this.batchCreateLarkRecords(payload);
        case 'batch-update':
          return this.batchUpdateLarkRecords(payload);
        case 'process-webhook':
          return this.processLarkWebhook(payload);
        default:
          throw new UnrecoverableError(`Unknown Lark action: ${action}`);
      }
    } catch (error) {
      this.logger.error(`Lark job failed:`, error);
      throw error;
    }
  }

  /**
   * Process Aliyun SMS jobs
   */
  private async processAliyunSmsJob(
    action: string,
    payload: any,
  ): Promise<any> {
    try {
      this.logger.debug(`Processing Aliyun SMS job: ${action}`);

      switch (action) {
        case 'send-sms':
          return this.sendAliyunSms(payload);
        default:
          throw new UnrecoverableError(`Unknown Aliyun SMS action: ${action}`);
      }
    } catch (error) {
      this.logger.error(`Aliyun SMS job failed:`, error);
      throw error;
    }
  }

  // Upload implementation methods
  private async uploadRecording(payload: any): Promise<any> {
    const { fileUrl, fileName, meetingId, storageProvider } = payload;

    this.logger.debug(
      `Uploading recording ${fileName} for meeting ${meetingId} to ${storageProvider}`,
    );

    // Simulate upload logic
    const uploadResult = {
      meetingId,
      fileName,
      fileUrl,
      storageProvider,
      uploadedUrl: `https://${storageProvider}.example.com/recordings/${meetingId}/${fileName}`,
      uploadedAt: new Date(),
      status: 'uploaded',
      metadata: {
        fileSize: Math.floor(Math.random() * 1000000), // Mock file size
        duration: Math.floor(Math.random() * 3600), // Mock duration in seconds
      },
    };

    this.logger.debug(
      `Recording uploaded successfully: ${uploadResult.uploadedUrl}`,
    );
    return uploadResult;
  }

  // Tencent Meeting implementation methods
  private async createTencentMeeting(payload: any): Promise<any> {
    const { meetingData } = payload;

    this.logger.debug(`Creating Tencent Meeting`);

    const result = {
      meetingId: payload.meetingId,
      tencentMeetingId: `tm_${Date.now()}`,
      status: 'created',
      createdAt: new Date(),
      meetingUrl: `https://meeting.tencent.com/dm/${Date.now()}`,
      metadata: meetingData,
    };

    return result;
  }

  private async updateTencentMeeting(payload: any): Promise<any> {
    this.logger.debug(`Updating Tencent Meeting ${payload.meetingId}`);
    return {
      meetingId: payload.meetingId,
      status: 'updated',
      updatedAt: new Date(),
    };
  }

  private async deleteTencentMeeting(payload: any): Promise<any> {
    this.logger.debug(`Deleting Tencent Meeting ${payload.meetingId}`);
    return {
      meetingId: payload.meetingId,
      status: 'deleted',
      deletedAt: new Date(),
    };
  }

  private async fetchTencentMeeting(payload: any): Promise<any> {
    this.logger.debug(`Fetching Tencent Meeting ${payload.meetingId}`);
    return {
      meetingId: payload.meetingId,
      status: 'fetched',
      fetchedAt: new Date(),
    };
  }

  private async processTencentWebhook(payload: any): Promise<any> {
    const { eventType, payload: webhookPayload } = payload;
    this.logger.debug(`Processing Tencent webhook: ${eventType}`);
    return {
      eventType,
      processed: true,
      processedAt: new Date(),
      data: webhookPayload,
    };
  }

  // Lark implementation methods
  private async createLarkRecord(payload: any): Promise<any> {
    const { appId, tableId, data } = payload;

    this.logger.debug(`Creating Lark record in ${appId}/${tableId}`);

    const result = {
      appId,
      tableId,
      recordId: `rec_${Date.now()}`,
      status: 'created',
      createdAt: new Date(),
      data,
    };

    return result;
  }

  private async updateLarkRecord(payload: any): Promise<any> {
    const { appId, tableId, recordId, data } = payload;
    this.logger.debug(
      `Updating Lark record ${recordId} in ${appId}/${tableId}`,
    );
    return {
      appId,
      tableId,
      recordId,
      status: 'updated',
      updatedAt: new Date(),
      data,
    };
  }

  private async deleteLarkRecord(payload: any): Promise<any> {
    const { appId, tableId, recordId } = payload;
    this.logger.debug(
      `Deleting Lark record ${recordId} in ${appId}/${tableId}`,
    );
    return {
      appId,
      tableId,
      recordId,
      status: 'deleted',
      deletedAt: new Date(),
    };
  }

  private async batchCreateLarkRecords(payload: any): Promise<any> {
    const { appId, tableId, records } = payload;
    this.logger.debug(
      `Batch creating ${records.length} Lark records in ${appId}/${tableId}`,
    );
    return {
      appId,
      tableId,
      created: records.length,
      status: 'batch-created',
      createdAt: new Date(),
    };
  }

  private async batchUpdateLarkRecords(payload: any): Promise<any> {
    const { appId, tableId, records } = payload;
    this.logger.debug(
      `Batch updating ${records.length} Lark records in ${appId}/${tableId}`,
    );
    return {
      appId,
      tableId,
      updated: records.length,
      status: 'batch-updated',
      updatedAt: new Date(),
    };
  }

  private async processLarkWebhook(payload: any): Promise<any> {
    const { eventType, payload: webhookPayload } = payload;
    this.logger.debug(`Processing Lark webhook: ${eventType}`);
    return {
      eventType,
      processed: true,
      processedAt: new Date(),
      data: webhookPayload,
    };
  }

  // Aliyun SMS implementation methods
  private async sendAliyunSms(payload: any): Promise<any> {
    const { phoneNumber, message, templateCode, templateParams } = payload;

    this.logger.debug(`Sending SMS to ${phoneNumber}`);

    // Simulate SMS sending
    const smsResult = {
      phoneNumber,
      message,
      templateCode,
      templateParams,
      messageId: `sms_${Date.now()}`,
      status: 'sent',
      sentAt: new Date(),
      provider: 'aliyun',
      cost: 0.05, // Mock cost
    };

    this.logger.debug(`SMS sent successfully to ${phoneNumber}`);
    return smsResult;
  }
}
