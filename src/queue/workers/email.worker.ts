import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { BaseWorker } from './base-worker';
import { QueueName, JobType, EmailJobData, JobResult } from '../types';

/**
 * Email sending worker
 */
@Injectable()
export class EmailWorker extends BaseWorker<EmailJobData> {
  constructor(configService: ConfigService, redisService: RedisService) {
    super(
      configService,
      redisService,
      QueueName.EMAIL_SENDING,
      configService.get<number>('QUEUE_CONCURRENCY_EMAIL', 2),
    );
  }

  /**
   * Process email jobs
   */
  protected async processJob(job: Job<EmailJobData>): Promise<JobResult> {
    return this.executeJob(job, async (data) => {
      const { to, subject, template, templateData, priority } = data;

      this.logger.log(
        `Sending ${template} email to ${Array.isArray(to) ? to.join(', ') : to}`,
        {
          jobId: job.id,
          correlationId: data.correlationId,
          priority,
        },
      );

      switch (job.name as JobType) {
        case JobType.SEND_VERIFICATION_EMAIL:
          return this.sendVerificationEmail(
            to as string,
            subject,
            templateData as Record<string, unknown>,
          );
        case JobType.SEND_PASSWORD_RESET_EMAIL:
          return this.sendPasswordResetEmail(
            to as string,
            subject,
            templateData as Record<string, unknown>,
          );
        case JobType.SEND_NOTIFICATION_EMAIL:
          return this.sendNotificationEmail(
            to,
            subject,
            template,
            templateData,
          );
        default:
          throw new Error(`Unknown email job type: ${job.name}`);
      }
    });
  }

  /**
   * Send verification email
   */
  private sendVerificationEmail(
    to: string,
    subject: string,
    templateData: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      this.logger.debug(`Sending verification email to ${to}`);

      // Simulate email sending
      // In real implementation, this would:
      // 1. Load email template
      // 2. Render template with data
      // 3. Send via email service (nodemailer, etc.)
      // 4. Handle delivery status
      // 5. Update user verification status if needed

      const emailResult = {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to,
        subject,
        template: 'verification',
        status: 'sent',
        sentAt: new Date(),
        provider: 'smtp',
        metadata: {
          verificationCode:
            typeof templateData['verificationCode'] === 'string'
              ? templateData['verificationCode']
              : undefined,
          verificationUrl:
            typeof templateData['verificationUrl'] === 'string'
              ? templateData['verificationUrl']
              : undefined,
        },
      };

      this.logger.debug(`Verification email sent successfully to ${to}`);
      return Promise.resolve(emailResult);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  private sendPasswordResetEmail(
    to: string,
    subject: string,
    templateData: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      this.logger.debug(`Sending password reset email to ${to}`);

      // Simulate email sending
      const emailResult = {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to,
        subject,
        template: 'password-reset',
        status: 'sent',
        sentAt: new Date(),
        provider: 'smtp',
        metadata: {
          resetToken:
            typeof templateData['resetToken'] === 'string'
              ? templateData['resetToken']
              : undefined,
          resetUrl:
            typeof templateData['resetUrl'] === 'string'
              ? templateData['resetUrl']
              : undefined,
          expiresInMinutes:
            typeof templateData['expiresInMinutes'] === 'number'
              ? templateData['expiresInMinutes']
              : 30,
        },
      };

      this.logger.debug(`Password reset email sent successfully to ${to}`);
      return Promise.resolve(emailResult);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Send notification email
   */
  private async sendNotificationEmail(
    to: string | string[],
    subject: string,
    template: string,
    templateData: Record<string, unknown>,
  ): Promise<any> {
    try {
      const recipients = Array.isArray(to) ? to : [to];
      this.logger.debug(
        `Sending ${template} notification email to ${recipients.length} recipient(s)`,
      );

      // Simulate email sending
      const emailResults = await Promise.all(
        recipients.map((recipient) => ({
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          to: recipient,
          subject,
          template,
          status: 'sent',
          sentAt: new Date(),
          provider: 'smtp',
          metadata: {
            templateData: {
              ...templateData,
              recipient,
            },
          },
        })),
      );

      this.logger.debug(
        `Notification emails sent successfully to ${recipients.length} recipient(s)`,
      );

      return {
        sent: emailResults.length,
        results: emailResults,
        template,
        subject,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send notification email to ${
          Array.isArray(to) ? to.join(', ') : to
        }: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
