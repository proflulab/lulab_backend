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
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from '../dto/send-email.dto';

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
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    // 检查必要的邮件配置
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpUser || !smtpPass) {
      this.logger.warn(
        '邮件服务配置缺失（SMTP_USER 或 SMTP_PASS），邮件功能将不可用',
      );
      return;
    }

    // 配置邮件传输器，这里使用环境变量配置
    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);

    // 验证邮件配置
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.warn('邮件服务配置错误，邮件功能将不可用:', error.message);
      } else {
        this.logger.log('邮件服务已就绪');
      }
    });
  }

  async sendEmail(
    sendEmailDto: SendEmailDto,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter) {
        const errorMsg = '邮件服务未配置，无法发送邮件';
        this.logger.warn(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      const { to, cc, bcc, subject, text, html } = sendEmailDto;

      const mailOptions = {
        from:
          this.configService.get<string>('SMTP_FROM') ||
          this.configService.get<string>('SMTP_USER'),
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
      if (!this.transporter) {
        this.logger.warn('邮件服务未配置，无法验证连接');
        return false;
      }
      await this.transporter.verify();
      this.logger.log('SMTP连接验证成功');
      return true;
    } catch (error) {
      this.logger.warn(`SMTP连接验证失败: ${error.message}`);
      return false;
    }
  }

  async sendSimpleEmail(options: EmailOptions): Promise<void> {
    try {
      if (!this.transporter) {
        const errorMsg = `邮件服务未配置，无法发送邮件到: ${options.to}`;
        this.logger.warn(errorMsg);
        throw new Error(errorMsg);
      }

      const mailOptions = {
        from:
          options.from ||
          this.configService.get<string>('SMTP_FROM') ||
          this.configService.get<string>('SMTP_USER'),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `邮件发送成功: ${options.to}, MessageId: ${result.messageId}`,
      );
    } catch (error) {
      this.logger.error(`邮件发送失败: ${options.to}`, error);
      throw error;
    }
  }

  async sendVerificationCode(
    email: string,
    code: string,
    type: 'register' | 'login' | 'reset_password',
  ): Promise<void> {
    const typeMap = {
      register: '注册',
      login: '登录',
      reset_password: '重置密码',
    };

    const subject = `LuLab ${typeMap[type]}验证码`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff; margin: 0;">LuLab</h1>
        </div>

        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">${typeMap[type]}验证码</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">您好，</p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">您正在进行${typeMap[type]}操作，验证码为：</p>

          <div style="background-color: #fff; padding: 20px; text-align: center; margin: 25px 0; border-radius: 6px; border: 2px dashed #007bff;">
            <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</span>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>⚠️ 安全提示：</strong><br>
              • 验证码有效期为 <strong>5分钟</strong>，请及时使用<br>
              • 请勿将验证码告诉他人<br>
              • 如非本人操作，请忽略此邮件
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">此邮件由 LuLab 系统自动发送，请勿回复</p>
          <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">© 2024 LuLab. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.sendSimpleEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const subject = '欢迎加入 LuLab！';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff; margin: 0;">LuLab</h1>
        </div>

        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">欢迎加入 LuLab！</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">亲爱的 ${username}，</p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">恭喜您成功注册 LuLab 账户！我们很高兴您能加入我们的社区。</p>

          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <h3 style="color: #155724; margin-top: 0;">🎉 注册成功</h3>
            <p style="color: #155724; margin: 0; font-size: 14px;">
              您的账户已经创建完成，现在可以开始使用 LuLab 的各项功能了。
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">开始使用</a>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.5;">如果您有任何问题或需要帮助，请随时联系我们的客服团队。</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">此邮件由 LuLab 系统自动发送，请勿回复</p>
          <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">© 2024 LuLab. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.sendSimpleEmail({
      to: email,
      subject,
      html,
    });
  }
}
