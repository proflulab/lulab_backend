import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, UnrecoverableError } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { BaseWorker } from './base-worker';
import { QueueName, ExternalApiJobData, JobResult } from '../types';

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
          return await Promise.resolve(this.processUploadJob(action, payload));
        case 'tencent-meeting':
          return await Promise.resolve(
            this.processTencentMeetingJob(action, payload),
          );
        case 'lark':
          return await Promise.resolve(this.processLarkJob(action, payload));
        case 'aliyun-sms':
          return await Promise.resolve(
            this.processAliyunSmsJob(action, payload),
          );
        default:
          throw new UnrecoverableError(`Unknown service: ${String(service)}`);
      }
    });
  }

  /**
   * Process upload jobs
   */
  private processUploadJob(
    action: string,
    payload: Record<string, unknown>,
  ): unknown {
    try {
      this.logger.debug(`Processing upload job: ${action}`);

      switch (action) {
        case 'upload-recording':
          return this.uploadRecording(payload);
        default:
          throw new UnrecoverableError(`Unknown upload action: ${action}`);
      }
    } catch (error) {
      this.logger.error(
        `Upload job failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Process Tencent Meeting jobs
   */
  private processTencentMeetingJob(
    action: string,
    payload: Record<string, unknown>,
  ): unknown {
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
      this.logger.error(
        `Tencent Meeting job failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Process Lark Bitable jobs
   */
  private processLarkJob(
    action: string,
    payload: Record<string, unknown>,
  ): unknown {
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
      this.logger.error(
        `Lark job failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Process Aliyun SMS jobs
   */
  private processAliyunSmsJob(
    action: string,
    payload: Record<string, unknown>,
  ): unknown {
    try {
      this.logger.debug(`Processing Aliyun SMS job: ${action}`);

      switch (action) {
        case 'send-sms':
          return this.sendAliyunSms(payload);
        default:
          throw new UnrecoverableError(`Unknown Aliyun SMS action: ${action}`);
      }
    } catch (error) {
      this.logger.error(
        `Aliyun SMS job failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  // Upload implementation methods
  private uploadRecording(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const { fileUrl, fileName, meetingId, storageProvider } = payload;

    this.logger.debug(
      `Uploading recording ${String(fileName)} for meeting ${String(meetingId)} to ${String(storageProvider)}`,
    );

    // Simulate upload logic
    const uploadResult = {
      meetingId,
      fileName,
      fileUrl,
      storageProvider,
      uploadedUrl: `https://${String(storageProvider)}.example.com/recordings/${String(meetingId)}/${String(fileName)}`,
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
  private createTencentMeeting(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
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

  private updateTencentMeeting(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    this.logger.debug(`Updating Tencent Meeting ${String(payload.meetingId)}`);
    return {
      meetingId: payload.meetingId,
      status: 'updated',
      updatedAt: new Date(),
    };
  }

  private deleteTencentMeeting(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    this.logger.debug(`Deleting Tencent Meeting ${String(payload.meetingId)}`);
    return {
      meetingId: payload.meetingId,
      status: 'deleted',
      deletedAt: new Date(),
    };
  }

  private fetchTencentMeeting(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    this.logger.debug(`Fetching Tencent Meeting ${String(payload.meetingId)}`);
    return {
      meetingId: payload.meetingId,
      status: 'fetched',
      fetchedAt: new Date(),
    };
  }

  private processTencentWebhook(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const { eventType, payload: webhookPayload } = payload;
    this.logger.debug(`Processing Tencent webhook: ${String(eventType)}`);
    return {
      eventType,
      processed: true,
      processedAt: new Date(),
      data: webhookPayload,
    };
  }

  // Lark implementation methods
  private createLarkRecord(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const { appId, tableId, data } = payload;

    this.logger.debug(
      `Creating Lark record in ${String(appId)}/${String(tableId)}`,
    );

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

  private updateLarkRecord(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const { appId, tableId, recordId, data } = payload;
    this.logger.debug(
      `Updating Lark record ${String(recordId)} in ${String(appId)}/${String(tableId)}`,
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

  private deleteLarkRecord(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const { appId, tableId, recordId } = payload;
    this.logger.debug(
      `Deleting Lark record ${String(recordId)} in ${String(appId)}/${String(tableId)}`,
    );
    return {
      appId,
      tableId,
      recordId,
      status: 'deleted',
      deletedAt: new Date(),
    };
  }

  private batchCreateLarkRecords(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const { appId, tableId, records } = payload;
    const recordsArray = records as unknown[];
    this.logger.debug(
      `Batch creating ${recordsArray.length} Lark records in ${String(appId)}/${String(tableId)}`,
    );
    return {
      appId,
      tableId,
      created: recordsArray.length,
      status: 'batch-created',
      createdAt: new Date(),
    };
  }

  private batchUpdateLarkRecords(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const { appId, tableId, records } = payload;
    const recordsArray = records as unknown[];
    this.logger.debug(
      `Batch updating ${recordsArray.length} Lark records in ${String(appId)}/${String(tableId)}`,
    );
    return {
      appId,
      tableId,
      updated: recordsArray.length,
      status: 'batch-updated',
      updatedAt: new Date(),
    };
  }

  private processLarkWebhook(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const { eventType, payload: webhookPayload } = payload;
    this.logger.debug(`Processing Lark webhook: ${String(eventType)}`);
    return {
      eventType,
      processed: true,
      processedAt: new Date(),
      data: webhookPayload,
    };
  }

  // Aliyun SMS implementation methods
  private sendAliyunSms(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const { phoneNumber, message, templateCode, templateParams } = payload;

    this.logger.debug(`Sending SMS to ${String(phoneNumber)}`);

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

    this.logger.debug(`SMS sent successfully to ${String(phoneNumber)}`);
    return smsResult;
  }
}
