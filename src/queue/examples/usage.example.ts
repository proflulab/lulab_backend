/**
 * Queue System Usage Examples
 *
 * This file demonstrates how to use the BullMQ-based queue system
 * for async tasks and scheduled jobs in the LuLab backend.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  MeetingQueueService,
  EmailQueueService,
  ExternalApiQueueService,
  QueueMonitoringService,
} from '../services';

@Injectable()
export class QueueUsageExamples {
  private readonly logger = new Logger(QueueUsageExamples.name);

  constructor(
    private readonly meetingQueue: MeetingQueueService,
    private readonly emailQueue: EmailQueueService,
    private readonly externalApiQueue: ExternalApiQueueService,
    private readonly queueMonitoring: QueueMonitoringService,
  ) {}

  /**
   * Example 1: Processing meeting recordings
   */
  async processMeetingRecording(meetingId: string, recordingUrl: string) {
    this.logger.log('Example 1: Processing meeting recording');

    // 1. Upload recording to cloud storage
    await this.externalApiQueue.addUploadRecordingJob({
      fileUrl: recordingUrl,
      fileName: `meeting-${meetingId}.mp4`,
      meetingId,
      storageProvider: 'aliyun',
    });

    // 2. Process meeting metadata
    await this.meetingQueue.addProcessJob(meetingId, 'process', {
      meetingData: { recordingUrl },
    });

    // 3. Analyze meeting content (delayed by 5 minutes to allow upload)
    await this.meetingQueue.addAnalysisJob(
      meetingId,
      'sentiment',
      { recordingUrl },
      { delay: 5 * 60 * 1000 }, // 5 minutes delay
    );

    // 4. Sync to external systems
    await this.meetingQueue.addSyncJob(meetingId, 'lark-bitable', {
      recordingUrl,
    });
  }

  /**
   * Example 2: User registration workflow
   */
  async userRegistrationWorkflow(
    email: string,
    phone: string,
    userData: { name: string },
  ) {
    this.logger.log('Example 2: User registration workflow');

    // 1. Send welcome email
    await this.emailQueue.sendVerificationEmail(email, {
      name: userData.name,
      verificationCode: '123456',
      verificationUrl: `https://app.lulab.com/verify?token=abc123`,
    });

    // 2. Send SMS verification
    await this.externalApiQueue.addSendSmsJob({
      phoneNumber: phone,
      message: `Welcome to LuLab! Your verification code is: 123456`,
      templateCode: 'SMS_VERIFICATION',
      templateParams: { code: '123456' },
    });

    // 3. Schedule follow-up email in 24 hours if not verified
    await this.emailQueue.scheduleRecurringNotification(
      email,
      'Complete Your Registration',
      'registration-reminder',
      { name: userData.name },
      '0 9 * * *', // Daily at 9 AM
    );
  }

  /**
   * Example 3: Meeting invitation and reminders
   */
  async scheduleMeetingNotifications(
    meetingId: string,
    attendees: string[],
    meetingTime: Date,
    meetingData: {
      title: string;
      url: string;
      organizer: string;
      agenda: string;
    },
  ) {
    this.logger.log('Example 3: Meeting invitation and reminders');

    // 1. Send immediate invitations
    await this.emailQueue.sendMeetingInvitationEmail(attendees, {
      meetingTitle: meetingData.title,
      meetingTime,
      meetingUrl: meetingData.url,
      organizerName: meetingData.organizer,
      agenda: meetingData.agenda,
    });

    // 2. Schedule reminder 1 hour before
    await this.emailQueue.sendMeetingReminderEmail(attendees, {
      meetingTitle: meetingData.title,
      meetingTime,
      meetingUrl: meetingData.url,
      reminderMinutes: 60,
    });

    // 3. Schedule reminder 15 minutes before
    await this.emailQueue.sendMeetingReminderEmail(attendees, {
      meetingTitle: meetingData.title,
      meetingTime,
      meetingUrl: meetingData.url,
      reminderMinutes: 15,
    });

    // 4. Sync meeting to Tencent Meeting
    await this.externalApiQueue.addTencentMeetingSyncJob({
      meetingId,
      action: 'create',
      meetingData,
    });
  }

  /**
   * Example 4: Bulk operations
   */
  async bulkMeetingProcessing(meetingIds: string[]) {
    this.logger.log('Example 4: Bulk meeting processing');

    const jobs = meetingIds.map((meetingId) => ({
      meetingId,
      action: 'process' as const,
      payload: { batchProcessing: true },
      options: { priority: 1 },
    }));

    // Process all meetings in bulk
    const results = await this.meetingQueue.addBulkProcessJobs(jobs);
    this.logger.log(`Added ${results.length} bulk processing jobs`);
  }

  /**
   * Example 5: Webhook processing
   */
  async processWebhookEvent(
    source: 'tencent-meeting' | 'lark',
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    this.logger.log('Example 5: Webhook processing');

    // Process webhook asynchronously
    await this.externalApiQueue.addWebhookProcessingJob(
      {
        source,
        eventType,
        payload,
        signature: payload.signature as string | undefined,
      },
      {
        priority: 5, // High priority for real-time events
      },
    );
  }

  /**
   * Example 6: Queue monitoring and management
   */
  async monitorQueueHealth() {
    this.logger.log('Example 6: Queue monitoring');

    // Check overall system health
    const systemHealth = await this.queueMonitoring.getSystemHealth();
    this.logger.log('System Health:', systemHealth);

    // Get metrics for all queues
    const metrics = await this.queueMonitoring.getAllQueueMetrics();
    this.logger.log('Queue Metrics:', metrics);

    // Clean old jobs if system is unhealthy
    if (!systemHealth.healthy) {
      this.logger.warn('System unhealthy, cleaning old jobs...');
      await this.queueMonitoring.cleanAllQueues({
        completedMaxAge: 60 * 60 * 1000, // 1 hour
        failedMaxAge: 24 * 60 * 60 * 1000, // 24 hours
        limit: 1000,
      });
    }
  }

  /**
   * Example 7: Scheduled maintenance tasks
   */
  async scheduleMaintenanceTasks() {
    this.logger.log('Example 7: Scheduled maintenance tasks');

    // Daily cleanup at 2 AM
    await this.externalApiQueue.scheduleRecurringApiSync(
      'tencent-meeting',
      'cleanup-expired-meetings',
      { maxAge: 30 }, // 30 days
      '0 2 * * *', // Daily at 2 AM
    );

    // Weekly report generation on Sundays at 8 AM
    await this.emailQueue.scheduleRecurringNotification(
      ['admin@lulab.com'],
      'Weekly Queue Report',
      'queue-report',
      { reportType: 'weekly' },
      '0 8 * * 0', // Sundays at 8 AM
    );
  }

  /**
   * Example 8: Error handling and retry strategies
   */
  async demonstrateErrorHandling() {
    this.logger.log('Example 8: Error handling and retry strategies');

    // Critical email with high retry count
    await this.emailQueue.sendVerificationEmail(
      'user@example.com',
      { verificationCode: '123456' },
      { priority: 'high' },
    );

    // External API call with custom retry configuration
    await this.externalApiQueue.addLarkBitableSyncJob(
      {
        appId: 'app123',
        tableId: 'table456',
        action: 'create',
        data: { important: true },
      },
      {
        priority: 8,
      },
    );

    // Upload with extended retry for large files
    await this.externalApiQueue.addUploadRecordingJob(
      {
        fileUrl: 'https://example.com/large-file.mp4',
        fileName: 'large-meeting.mp4',
        meetingId: 'meeting-123',
        storageProvider: 'aliyun',
      },
      {
        maxRetries: 10, // More retries for large files
        priority: 3,
      },
    );
  }

  /**
   * Run all examples
   */
  async runAllExamples() {
    this.logger.log('Running all queue usage examples...');

    try {
      await this.processMeetingRecording(
        'meeting-001',
        'https://example.com/recording.mp4',
      );
      await this.userRegistrationWorkflow('user@example.com', '+1234567890', {
        name: 'Test User',
      });
      await this.scheduleMeetingNotifications(
        'meeting-002',
        ['attendee1@example.com', 'attendee2@example.com'],
        new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        {
          title: 'Team Standup',
          url: 'https://meeting.example.com/123',
          organizer: 'John Doe',
          agenda: 'Project updates',
        },
      );
      await this.bulkMeetingProcessing([
        'meeting-003',
        'meeting-004',
        'meeting-005',
      ]);
      await this.processWebhookEvent('tencent-meeting', 'meeting.ended', {
        meetingId: 'tm-123',
      });
      await this.monitorQueueHealth();
      await this.scheduleMaintenanceTasks();
      await this.demonstrateErrorHandling();

      this.logger.log('All examples completed successfully!');
    } catch (error) {
      this.logger.error('Example execution failed:', error);
    }
  }
}

/**
 * Standalone execution example
 */
export function runStandaloneExample(): void {
  const logger = new Logger('QueueExamples');
  logger.log('This is how you would use the queue system in your services...');

  // Example: In a controller or service
  /*
    @Injectable()
    export class MeetingService {
      constructor(
        private readonly meetingQueue: MeetingQueueService,
        private readonly emailQueue: EmailQueueService,
      ) {}
  
      async createMeeting(meetingData: CreateMeetingDto) {
        // Save meeting to database first
        const meeting = await this.meetingRepository.create(meetingData);
  
        // Then queue async tasks
        await this.meetingQueue.addProcessJob(meeting.id, 'process', {
          meetingData: meeting,
        });
  
        // Send invitations asynchronously
        await this.emailQueue.sendMeetingInvitationEmail(
          meeting.attendees.map(a => a.email),
          {
            meetingTitle: meeting.title,
            meetingTime: meeting.startTime,
            meetingUrl: meeting.url,
            organizerName: meeting.organizer.name,
          },
        );
  
        return meeting;
      }
    }
    */
}

if (require.main === module) {
  void runStandaloneExample();
}
