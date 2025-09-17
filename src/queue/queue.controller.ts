import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import {
  QueueMonitoringService,
  MeetingQueueService,
  EmailQueueService,
  ExternalApiQueueService,
} from './services';
import { QueueName } from './types';

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
        `Failed to get system health: ${error.message}`,
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
        `Failed to get queue metrics: ${error.message}`,
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
        `Failed to get metrics for queue ${queueName}: ${error.message}`,
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
        `Failed to get health for queue ${queueName}: ${error.message}`,
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
      return await this.queueMonitoring.getJobDetails(queueName, jobId);
    } catch (error) {
      throw new HttpException(
        `Failed to get job details: ${error.message}`,
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
        `Failed to clean queues: ${error.message}`,
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
        `Failed to pause queues: ${error.message}`,
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
        `Failed to resume queues: ${error.message}`,
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
        `Failed to add meeting job: ${error.message}`,
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
        `Failed to add email job: ${error.message}`,
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
      let job;
      switch (body.service) {
        case 'tencent-meeting':
          job = await this.externalApiQueue.addTencentMeetingSyncJob(
            {
              meetingId: body.payload.meetingId,
              action: body.action as any,
              meetingData: body.payload,
            },
            { priority: body.priority },
          );
          break;
        case 'lark':
          job = await this.externalApiQueue.addLarkBitableSyncJob(
            body.payload,
            { priority: body.priority },
          );
          break;
        case 'aliyun-sms':
          job = await this.externalApiQueue.addSendSmsJob(body.payload, {
            priority: body.priority,
          });
          break;
        case 'upload':
          job = await this.externalApiQueue.addUploadRecordingJob(
            body.payload,
            { priority: body.priority, maxRetries: body.maxRetries },
          );
          break;
        default:
          throw new Error(`Unknown service: ${body.service}`);
      }
      return {
        jobId: job?.id,
        message: `${body.service} job added successfully`,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to add external API job: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
