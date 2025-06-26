import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from '../dto/send-email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.createTransporter();
  }

  private createTransporter() {
    // 配置邮件传输器，这里使用环境变量配置
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // 发送者邮箱
        pass: process.env.SMTP_PASS, // 邮箱密码或应用专用密码
      },
    });
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { to, cc, bcc, subject, text, html } = sendEmailDto;

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER, // 发送者邮箱
        to,
        cc,
        bcc,
        subject,
        text,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`邮件发送成功: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error(`邮件发送失败: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP连接验证成功');
      return true;
    } catch (error) {
      this.logger.error(`SMTP连接验证失败: ${error.message}`);
      return false;
    }
  }
}