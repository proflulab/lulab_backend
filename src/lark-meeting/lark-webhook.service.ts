/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-29 19:04:19
 * @LastEditors: Luckymingxuan <songmingxuan936@gmail.com>
 * @LastEditTime: 2025-10-03 16:01:40
 * @FilePath: \lulab_backend\src\lark-meeting\lark-webhook.service.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lark from '@larksuiteoapi/node-sdk';
import type { Request, Response } from 'express';
import { MeetingRecordingService } from '../integrations/lark/services/meeting-recording.service';

/**
 * 飞书 Webhook处理服务
 */
@Injectable()
export class LarkWebhookHandler {
  // 给将来日志的打印起一个统一的类名
  private readonly logger = new Logger(LarkWebhookHandler.name);

  // SDK 的 EventDispatcher，用于自动处理加密和事件分发(目前这个是声明变量)
  private readonly eventDispatcher: lark.EventDispatcher;

  // SDK 返回的 Express 中间件，用于直接处理 req/res
  private readonly expressAdapter: any;

  // 这里保存 handler 的返回值
  private lastEventData: any;

  // 初始化整个 LarkWebhookHandler 服务的核心组件和工作流程
  constructor(
    private readonly configService: ConfigService,
    private readonly recordingService: MeetingRecordingService, // 飞书会议记录服务
  ) {
    // 从配置读取飞书凭证
    // encryptKey 用于解密 payload
    // verificationToken 用于校验请求是否来自飞书
    const encryptKey = this.configService.get<string>('LARK_ENCRYPT_KEY') || '';
    const verificationToken =
      this.configService.get<string>('LARK_VERIFICATION_TOKEN') || '';

    // 1️⃣ 创建 EventDispatcher
    // EventDispatcher 是 SDK 的核心，用来做：
    // - 解密 encrypt 字段（如果 encryptKey 不为空）
    // - 校验 verificationToken（如果不为空）
    // - 调度事件到你注册的 handler
    this.eventDispatcher = new lark.EventDispatcher({
      encryptKey, // 解密用
      verificationToken, // 校验用
      loggerLevel: lark.LoggerLevel.info, // SDK 内部日志等级
    });

    // 2️⃣ 注册事件回调
    // 必须注册，否则 SDK 会打印 "no undefined handle" 警告
    // 每个事件都对应一个异步函数
    this.eventDispatcher.register({
      // 企业会议结束事件: 发生在会议结束时，包含企业内所有会议结束事件。参考
      'vc.meeting.all_meeting_ended_v1': async (data) => {
        // // data 已经是 SDK 解密/解析后的对象（若启用了加密）
        // this.logger.log(
        //   '[handler] vc.meeting.all_meeting_ended_v1 -> ' +
        //     JSON.stringify(data),
        // );

        // 调用实例方法获取录制文件信息-测试后续还需要更改
        const recordingInfo =
          await this.recordingService.getMeetingRecordingInfo(
            '7556236982563061764',
          );
        // 处理录制文件信息，例如记录日志或存数据库
        this.logger.log(`录制文件信息: ${JSON.stringify(recordingInfo)}`);

        // // 在这里做你需要的业务处理，例如写入 DB、推送通知等
        // return 'success';
      },

      // 示例：更多事件可以在这里注册
      // 'im.message.receive_v1': async (data) => { ... }
    });

    // 3️⃣ 把 EventDispatcher 变成 Express 能用的处理器
    //    可以直接接收 req/res，自动处理 challenge、校验、解密和事件分发
    //    例: 在 controller 中，我们直接调用这个中间件： await this.expressAdapter(req, res)
    this.expressAdapter = lark.adaptExpress(this.eventDispatcher, {
      autoChallenge: true, // 开启后，SDK 会自动处理飞书发来的验证请求（challenge），不用我们手动回复
    });
  }

  /**
   * 入口：处理来自 Controller 转发的 req/res
   * 这里直接把 express 的 req/res 交给 SDK 的 adaptExpress 去做所有解析/解密/分发工作
   */
  async handleWebhookEvent(req: Request, res: Response): Promise<void> {
    this.logger.log('开始处理飞书 Webhook(交由 SDK adaptExpress)');

    try {
      // adaptExpress 是个**中间件**，直接给它 req/res 就行
      // SDK 会帮你：
      // - 解析请求内容（明文或加密）
      // - 校验请求是否合法
      // - 自动解密
      // - 自动回应 challenge
      // - 调用你注册的事件处理函数
      await this.expressAdapter(req, res);

      this.logger.log('飞书 Webhook 处理完成(SDK 已完成分发)');
    } catch (err: any) {
      this.logger.error('调用 SDK adaptExpress 失败', err?.stack || err);
      // adaptExpress 里通常会直接在 res 上返回，但若抛出异常，这里记录并把异常向上抛以便 controller 可以处理
      throw err;
    }
  }
}
