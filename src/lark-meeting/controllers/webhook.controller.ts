/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-22 23:46:35
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-23 02:24:43
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
import { MeetingEndedEventData } from '../types/lark-meeting.types';
import { Response, Request } from 'express';
import { MeetingBitableRepository } from '@/integrations/lark';
import { toMs } from '../time.util';

@ApiTags('Webhooks')
@Controller('webhooks/lark')
export class LarkWebhookController {
  private readonly logger = new Logger(LarkWebhookController.name);
  private readonly meetingBitable: MeetingBitableRepository;
  private readonly eventDispatcher: EventDispatcher;

  constructor(meetingBitable: MeetingBitableRepository) {
    this.meetingBitable = meetingBitable;
    this.eventDispatcher = new EventDispatcher({
      encryptKey: process.env.LARK_EVENT_ENCRYPT_KEY || '',
      verificationToken: process.env.LARK_EVENT_VERIFICATION_TOKEN || '',
    }).register({
      'vc.meeting.all_meeting_ended_v1': (data: MeetingEndedEventData) => {
        console.log('收到会议结束事件:', JSON.stringify(data));
        const meetingId = data?.meeting?.id;
        if (meetingId) {
          const m = data.meeting;
          const startTime = toMs(m.start_time);
          const endTime = toMs(m.end_time);
          this.meetingBitable
            .upsertMeetingRecord({
              platform: '飞书会议',
              meeting_id: m.id,
              ...(m.topic && { subject: m.topic }),
              ...(m.meeting_no && { meeting_code: m.meeting_no }),
              ...(startTime !== undefined && { start_time: startTime }),
              ...(endTime !== undefined && { end_time: endTime }),
            })
            .catch(() => undefined);
        }
        return 'success';
      },
      '*': (data: Record<string, unknown>) => {
        console.log('收到未注册的飞书事件:', data);
        return 'success';
      },
    });
  }

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
    const handleLarkEvent = createLarkAdapter(this.eventDispatcher, {
      autoChallenge: true, // 自动处理飞书的URL验证
      needCheck: true, // 是否启用事件安全验证，生产环境建议设为true
    });

    // 处理事件
    await handleLarkEvent(request, response);
  }
}
