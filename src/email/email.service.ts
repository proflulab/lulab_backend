/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-06 05:58:54
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-08-03 20:28:15
 * @FilePath: /lulab_backend/src/email/email.service.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Injectable, Logger } from '@nestjs/common';
import { SendEmailDto } from './dto/send-email.dto';
import { MailerService, MailerSendOptions } from '../integrations/email';
import {
  buildWelcomeEmail,
  buildVerificationEmail,
} from '../common/email-templates';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(private readonly mailer: MailerService) {}

  async sendEmail(
    sendEmailDto: SendEmailDto,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { to, cc, bcc, subject, text, html } = sendEmailDto;

      const mailOptions: MailerSendOptions = {
        to,
        cc,
        bcc,
        subject,
        text,
        html,
      };

      const info = await this.mailer.send(mailOptions);

      if (!info) {
        return { success: false, error: '邮件服务未配置，无法发送邮件' };
      }

      this.logger.log(`邮件发送成功: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `邮件发送失败: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    return this.mailer.verify();
  }

  async sendSimpleEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions: MailerSendOptions = {
        from: options.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await this.mailer.send(mailOptions);
      if (!result) {
        const errorMsg = `邮件服务未配置，无法发送邮件到: ${options.to}`;
        this.logger.warn(errorMsg);
        throw new Error(errorMsg);
      }
      this.logger.log(
        `邮件发送成功: ${options.to}, MessageId: ${result.messageId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`邮件发送失败: ${options.to}`, errorMessage);
      throw error;
    }
  }

  async sendVerificationCode(
    email: string,
    code: string,
    type: 'register' | 'login' | 'reset_password',
  ): Promise<void> {
    const { subject, html } = buildVerificationEmail(type, code);
    await this.sendSimpleEmail({ to: email, subject, html });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const { subject, html } = buildWelcomeEmail(username);
    await this.sendSimpleEmail({ to: email, subject, html });
  }
}
