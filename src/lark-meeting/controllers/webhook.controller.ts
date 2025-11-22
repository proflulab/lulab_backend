/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-22 23:46:35
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-23 00:03:58
 * @FilePath: /lulab_backend/src/lark-meeting/controllers/webhook.controller.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@/auth/decorators/public.decorator';
import { EventDispatcher } from '@larksuiteoapi/node-sdk';
import { createLarkAdapter } from '../adapter/lark-event-adapter';
import { Response, Request } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks/lark')
export class LarkWebhookController {
  private readonly logger = new Logger(LarkWebhookController.name);

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lark Webhook',
    description: '接收 Lark Webhook 事件',
  })
  @ApiResponse({ status: 200, description: 'Webhook 处理成功' })
  async handleLarkWebhook(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    this.logger.log('收到 Lark Webhook 请求');

    // 创建适配器处理函数
    const handleLarkEvent = createLarkAdapter(eventDispatcher, {
      autoChallenge: true, // 自动处理飞书的URL验证
      needCheck: true, // 是否启用事件安全验证，生产环境建议设为true
    });

    // 处理事件
    await handleLarkEvent(request, response);
  }
}

// 事件分发器配置（请根据实际填写加密密钥和校验Token）
const eventDispatcher = new EventDispatcher({
  encryptKey: process.env.LARK_EVENT_ENCRYPT_KEY || '',
  verificationToken: process.env.LARK_EVENT_VERIFICATION_TOKEN || '',
}).register({
  'vc.meeting.all_meeting_ended_v1': (data: Record<string, unknown>) => {
    console.log('收到会议结束事件:', data);
    return 'success';
  },
  // 添加通用事件处理
  '*': (data: Record<string, unknown>) => {
    console.log('收到未注册的飞书事件:', data);
    return 'success';
  },
});
