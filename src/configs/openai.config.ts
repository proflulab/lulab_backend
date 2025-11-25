/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-01-10
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-25 22:55:55
 * @FilePath: /lulab_backend/src/configs/openai.config.ts
 * @Description: OpenAI 配置
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { registerAs, ConfigType } from '@nestjs/config';

export const openaiConfig = registerAs('openai', () => ({
  apiKey: {
    ark: process.env.ARK_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
  },
  baseURL:
    process.env.OPENAI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  model: process.env.OPENAI_MODEL || '{TEMPLATE_ENDPOINT_ID}',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '16000', 10),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
}));

export type OpenAIConfig = ConfigType<typeof openaiConfig>;
