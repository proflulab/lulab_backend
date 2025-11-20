/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-29 19:45:09
 * @LastEditors: Mingxuan 159552597+Luckymingxuan@users.noreply.github.com
 * @LastEditTime: 2025-10-04 16:39:41
 * @FilePath: \lulab_backend\src\lark-meeting\lark-webhook.controller.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LarkWebhookHandler } from './lark-webhook.service';
import { Public } from '@/auth/decorators/public.decorator';
import type { Request, Response } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks/feishu')
@Public()
export class LarkWebhookController {
  // Nest 自带的日志工具，方便打印调试信息
  private readonly logger = new Logger(LarkWebhookController.name);

  constructor(private readonly larkWebhookHandler: LarkWebhookHandler) {}

  /**
   * 入口：接收飞书发送的 Webhook 请求（POST）
   *
   * 为什么不用 @Body()：
   *   - 飞书的 SDK 自带解密和解析逻辑
   *   - 我们必须把原始的 req/res 对象传给 SDK，才能正确处理加密事件和 challenge
   *
   * 参数：
   *   @Req() req  - express 的请求对象，包含 headers、body 等
   *   @Res() res  - express 的响应对象，用于返回 HTTP 响应
   */
  @Post()
  @HttpCode(HttpStatus.OK) // 默认返回 200 OK
  @ApiOperation({
    summary: '飞书Webhook',
    description: '接收飞书的Webhook事件',
  })
  @ApiResponse({ status: 200, description: 'Webhook处理成功' })
  async handleFeishuWebhook(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log('收到飞书 Webhook 请求(Controller)');

    try {
      // 核心操作：把请求交给 Service 处理
      // Service 内部会调用 SDK 的 adaptExpress 自动完成：
      // 1. body 解析
      // 2. verificationToken 校验
      // 3. encrypt 字段解密
      // 4. 自动响应 challenge（url_verification）
      // 5. 分发事件到注册的 handler
      await this.larkWebhookHandler.handleWebhookEvent(req, res);

      // 如果 SDK 没有直接写响应，我们手动返回 200
      if (!res.headersSent) {
        res.status(200).send('ok');
      }
    } catch (err: unknown) {
      const details =
        err instanceof Error ? (err.stack ?? err.message) : String(err);
      this.logger.error('处理 webhook 失败 (controller 捕获)', details);
      // 如果还没响应，返回 500
      if (!res.headersSent) {
        res.status(500).send('error');
      }
    }
  }
}
