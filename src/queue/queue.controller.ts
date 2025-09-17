import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  QueueMonitoringService,
  MeetingQueueService,
  EmailQueueService,
  ExternalApiQueueService,
} from './services';
import { QueueName } from './types';

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

@ApiTags('Queue Management')
@Controller('admin/queues')
export class QueueController {
  constructor(
    private readonly queueMonitoring: QueueMonitoringService,
    private readonly meetingQueue: MeetingQueueService,
    private readonly emailQueue: EmailQueueService,
    private readonly externalApiQueue: ExternalApiQueueService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get overall queue system health' })
  @ApiResponse({ status: 200, description: 'System health status' })
  async getSystemHealth() {
    try {
      return await this.queueMonitoring.getSystemHealth();
    } catch (error) {
      throw new HttpException(
        `Failed to get system health: ${errorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get metrics for all queues' })
  @ApiResponse({ status: 200, description: 'Queue metrics' })
  async getAllMetrics() {
    try {
      return await this.queueMonitoring.getAllQueueMetrics();
    } catch (error) {
      throw new HttpException(
        `Failed to get queue metrics: ${errorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':queueName/metrics')
  @ApiOperation({ summary: 'Get metrics for a specific queue' })
  @ApiParam({ name: 'queueName', enum: QueueName, description: 'Queue name' })
  @ApiResponse({ status: 200, description: 'Queue metrics' })
  async getQueueMetrics(@Param('queueName') queueName: QueueName) {
    try {
      return await this.queueMonitoring.getQueueMetrics(queueName);
    } catch (error) {
      throw new HttpException(
        `Failed to get metrics for queue ${queueName}: ${errorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':queueName/health')
  @ApiOperation({ summary: 'Get health status for a specific queue' })
  @ApiParam({ name: 'queueName', enum: QueueName, description: 'Queue name' })
  @ApiResponse({ status: 200, description: 'Queue health status' })
  async getQueueHealth(@Param('queueName') queueName: QueueName) {
    try {
      return await this.queueMonitoring.getQueueHealth(queueName);
    } catch (error) {
      throw new HttpException(
        `Failed to get health for queue ${queueName}: ${errorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':queueName/jobs/:jobId')
  @ApiOperation({ summary: 'Get job details' })
  @ApiParam({ name: 'queueName', enum: QueueName, description: 'Queue name' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job details' })
  async getJobDetails(
    @Param('queueName') queueName: QueueName,
    @Param('jobId') jobId: string,
  ) {
    try {
      const details: unknown = await this.queueMonitoring.getJobDetails(
        queueName,
        jobId,
      );
      return details as Record<string, unknown>;
    } catch (error) {
      throw new HttpException(
        `Failed to get job details: ${errorMessage(error)}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('clean')
  @ApiOperation({ summary: 'Clean old jobs from all queues' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        completedMaxAge: {
          type: 'number',
          description: 'Max age for completed jobs in milliseconds',
        },
        failedMaxAge: {
          type: 'number',
          description: 'Max age for failed jobs in milliseconds',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of jobs to clean',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cleanup results' })
  async cleanQueues(
    @Body()
    body: {
      completedMaxAge?: number;
      failedMaxAge?: number;
      limit?: number;
    } = {},
  ) {
    try {
      return await this.queueMonitoring.cleanAllQueues(body);
    } catch (error) {
      throw new HttpException(
        `Failed to clean queues: ${errorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('pause')
  @ApiOperation({ summary: 'Pause all queues' })
  @ApiResponse({ status: 200, description: 'All queues paused' })
  async pauseAllQueues() {
    try {
      await this.queueMonitoring.pauseAllQueues();
      return { message: 'All queues paused successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to pause queues: ${errorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('resume')
  @ApiOperation({ summary: 'Resume all queues' })
  @ApiResponse({ status: 200, description: 'All queues resumed' })
  async resumeAllQueues() {
    try {
      await this.queueMonitoring.resumeAllQueues();
      return { message: 'All queues resumed successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to resume queues: ${errorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Example endpoints for adding jobs (for testing/admin purposes)
  @Post('meeting/process')
  @ApiOperation({ summary: 'Add meeting processing job' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        meetingId: { type: 'string' },
        action: { type: 'string', enum: ['process', 'analyze', 'sync'] },
        payload: { type: 'object' },
        userId: { type: 'string' },
        priority: { type: 'number' },
      },
      required: ['meetingId', 'action', 'payload'],
    },
  })
  async addMeetingJob(
    @Body()
    body: {
      meetingId: string;
      action: 'process' | 'analyze' | 'sync';
      payload: any;
      userId?: string;
      priority?: number;
    },
  ) {
    try {
      const job = await this.meetingQueue.addProcessJob(
        body.meetingId,
        body.action,
        body.payload,
        {
          userId: body.userId,
          jobOptions: { priority: body.priority },
        },
      );
      return { jobId: job?.id, message: 'Meeting job added successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to add meeting job: ${errorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('email/send')
  @ApiOperation({ summary: 'Add email sending job' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        template: { type: 'string' },
        templateData: { type: 'object' },
        priority: { type: 'string', enum: ['low', 'normal', 'high'] },
        delay: { type: 'number' },
      },
      required: ['to', 'subject', 'template', 'templateData'],
    },
  })
  async addEmailJob(
    @Body()
    body: {
      to: string;
      subject: string;
      template: string;
      templateData: any;
      priority?: 'low' | 'normal' | 'high';
      delay?: number;
    },
  ) {
    try {
      const job = await this.emailQueue.sendNotificationEmail(
        body.to,
        body.subject,
        body.template,
        body.templateData,
        {
          priority: body.priority,
          delay: body.delay,
        },
      );
      return { jobId: job?.[0]?.id, message: 'Email job added successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to add email job: ${errorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('external-api/sync')
  @ApiOperation({ summary: 'Add external API sync job' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          enum: ['tencent-meeting', 'lark', 'aliyun-sms', 'upload'],
        },
        action: { type: 'string' },
        payload: { type: 'object' },
        priority: { type: 'number' },
        maxRetries: { type: 'number' },
      },
      required: ['service', 'action', 'payload'],
    },
  })
  async addExternalApiJob(
    @Body()
    body: {
      service: 'tencent-meeting' | 'lark' | 'aliyun-sms' | 'upload';
      action: string;
      payload: any;
      priority?: number;
      maxRetries?: number;
    },
  ) {
    try {
      let job: { id?: string } | null | undefined;
      switch (body.service) {
        case 'tencent-meeting':
          job = await this.externalApiQueue.addTencentMeetingSyncJob(
            {
              meetingId: (body.payload as { meetingId: string }).meetingId,
              action: body.action as unknown as
                | 'create'
                | 'update'
                | 'delete'
                | 'fetch',
              meetingData: body.payload as unknown as Record<string, unknown>,
            },
            { priority: body.priority },
          );
          break;
        case 'lark':
          job = await this.externalApiQueue.addLarkBitableSyncJob(
            body.payload as unknown as {
              appId: string;
              tableId: string;
              recordId?: string;
              action:
                | 'create'
                | 'update'
                | 'delete'
                | 'batch-create'
                | 'batch-update';
              data: any;
            },
            { priority: body.priority },
          );
          break;
        case 'aliyun-sms':
          job = await this.externalApiQueue.addSendSmsJob(
            body.payload as unknown as {
              phoneNumber: string;
              message: string;
              templateCode?: string;
              templateParams?: Record<string, string>;
            },
            {
              priority: body.priority,
            },
          );
          break;
        case 'upload':
          job = await this.externalApiQueue.addUploadRecordingJob(
            body.payload as unknown as {
              fileUrl: string;
              fileName: string;
              meetingId: string;
              storageProvider: 'aliyun' | 'aws' | 'tencent';
            },
            { priority: body.priority, maxRetries: body.maxRetries },
          );
          break;
        default:
          throw new Error('Unknown service');
      }
      return {
        jobId: job?.id,
        message: `${body.service} job added successfully`,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to add external API job: ${errorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
