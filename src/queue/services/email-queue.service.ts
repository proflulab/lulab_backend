import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { BaseQueueService } from './base-queue.service';
import { QueueName, JobType, EmailJobData, QueueJobOptions } from '../types';
import { randomUUID } from 'crypto';

/**
 * Email sending queue service
 */
@Injectable()
export class EmailQueueService extends BaseQueueService {
  constructor(configService: ConfigService, redisService: RedisService) {
    super(configService, redisService, QueueName.EMAIL_SENDING);
  }

  /**
   * Add verification email job
   */
  async sendVerificationEmail(
    to: string,
    templateData: {
      name?: string;
      verificationCode: string;
      verificationUrl?: string;
    },
    options?: {
      userId?: string;
      priority?: 'low' | 'normal' | 'high';
      delay?: number;
    },
  ) {
    const jobData: EmailJobData = {
      idempotencyKey: `verify-${to}-${templateData.verificationCode}`,
      userId: options?.userId,
      correlationId: randomUUID(),
      createdAt: new Date(),
      to,
      subject: 'Email Verification Required',
      template: 'verification',
      templateData,
      priority: options?.priority || 'high',
    };

    const jobOptions: QueueJobOptions = {
      priority: this.getPriorityValue(options?.priority || 'high'),
      delay: options?.delay,
    };

    return this.addJob(JobType.SEND_VERIFICATION_EMAIL, jobData, jobOptions);
  }

  /**
   * Add password reset email job
   */
  async sendPasswordResetEmail(
    to: string,
    templateData: {
      name?: string;
      resetToken: string;
      resetUrl: string;
      expiresInMinutes?: number;
    },
    options?: {
      userId?: string;
      priority?: 'low' | 'normal' | 'high';
    },
  ) {
    const jobData: EmailJobData = {
      idempotencyKey: `reset-${to}-${templateData.resetToken}`,
      userId: options?.userId,
      correlationId: randomUUID(),
      createdAt: new Date(),
      to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      templateData,
      priority: options?.priority || 'high',
    };

    const jobOptions: QueueJobOptions = {
      priority: this.getPriorityValue(options?.priority || 'high'),
    };

    return this.addJob(JobType.SEND_PASSWORD_RESET_EMAIL, jobData, jobOptions);
  }

  /**
   * Add notification email job
   */
  async sendNotificationEmail(
    to: string | string[],
    subject: string,
    template: string,
    templateData: Record<string, any>,
    options?: {
      userId?: string;
      priority?: 'low' | 'normal' | 'high';
      delay?: number;
      metadata?: Record<string, any>;
    },
  ) {
    const recipients = Array.isArray(to) ? to : [to];
    const jobs = recipients.map((recipient) => {
      const jobData: EmailJobData = {
        idempotencyKey: `notification-${recipient}-${template}-${Date.now()}`,
        userId: options?.userId,
        correlationId: randomUUID(),
        metadata: options?.metadata,
        createdAt: new Date(),
        to: recipient,
        subject,
        template,
        templateData,
        priority: options?.priority || 'normal',
      };

      return {
        name: JobType.SEND_NOTIFICATION_EMAIL,
        data: jobData,
        opts: {
          priority: this.getPriorityValue(options?.priority || 'normal'),
          delay: options?.delay,
        },
      };
    });

    return this.addBulkJobs(jobs);
  }

  /**
   * Add meeting invitation email job
   */
  async sendMeetingInvitationEmail(
    to: string | string[],
    templateData: {
      meetingTitle: string;
      meetingTime: Date;
      meetingUrl?: string;
      organizerName: string;
      agenda?: string;
    },
    options?: {
      userId?: string;
      priority?: 'low' | 'normal' | 'high';
      delay?: number;
    },
  ) {
    return this.sendNotificationEmail(
      to,
      `Meeting Invitation: ${templateData.meetingTitle}`,
      'meeting-invitation',
      templateData,
      {
        ...options,
        priority: options?.priority || 'normal',
      },
    );
  }

  /**
   * Add meeting reminder email job
   */
  async sendMeetingReminderEmail(
    to: string | string[],
    templateData: {
      meetingTitle: string;
      meetingTime: Date;
      meetingUrl?: string;
      reminderMinutes: number;
    },
    options?: {
      userId?: string;
      delay?: number;
    },
  ) {
    const delay =
      options?.delay ||
      this.calculateReminderDelay(
        templateData.meetingTime,
        templateData.reminderMinutes,
      );

    return this.sendNotificationEmail(
      to,
      `Meeting Reminder: ${templateData.meetingTitle}`,
      'meeting-reminder',
      templateData,
      {
        ...options,
        priority: 'normal',
        delay,
      },
    );
  }

  /**
   * Schedule recurring email notifications
   */
  async scheduleRecurringNotification(
    to: string | string[],
    subject: string,
    template: string,
    templateData: Record<string, any>,
    cronExpression: string,
    options?: {
      userId?: string;
      priority?: 'low' | 'normal' | 'high';
      metadata?: Record<string, any>;
    },
  ) {
    const jobData: EmailJobData = {
      idempotencyKey: `recurring-${template}-${Array.isArray(to) ? to.join(',') : to}`,
      userId: options?.userId,
      correlationId: randomUUID(),
      metadata: options?.metadata,
      createdAt: new Date(),
      to,
      subject,
      template,
      templateData,
      priority: options?.priority || 'normal',
    };

    return this.addJob(JobType.SEND_NOTIFICATION_EMAIL, jobData, {
      priority: this.getPriorityValue(options?.priority || 'normal'),
      repeat: { pattern: cronExpression },
    });
  }

  /**
   * Get priority value for BullMQ
   */
  private getPriorityValue(priority: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'high':
        return 10;
      case 'normal':
        return 5;
      case 'low':
        return 1;
      default:
        return 5;
    }
  }

  /**
   * Calculate delay for meeting reminder
   */
  private calculateReminderDelay(
    meetingTime: Date,
    reminderMinutes: number,
  ): number {
    const reminderTime = new Date(
      meetingTime.getTime() - reminderMinutes * 60 * 1000,
    );
    const delay = reminderTime.getTime() - Date.now();
    return Math.max(0, delay); // Don't allow negative delays
  }
}
