/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-01 06:30:18
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-01 06:31:34
 * @FilePath: /lulab_backend/src/configs/email.config.ts
 * @Description: Configuration for email service settings
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { registerAs, ConfigType } from '@nestjs/config';

export const emailConfig = registerAs('email', () => ({
  smtp: {
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '',
  },
}));

export type EmailConfig = ConfigType<typeof emailConfig>;
