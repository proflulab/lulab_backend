/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-25 05:15:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-25 09:09:52
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/events/smart-fullsummary.handler.ts
 * @Description: 智能摘要完成事件处理器
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from '../base/base-event.handler';
import { TencentEventPayload } from '../../types';
import { RecordingContentService } from '../../services/recording-content.service';

/**
 * 智能摘要完成事件处理器
 */

@Injectable()
export class SmartFullsummaryHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'smart.fullsummary';

  constructor(
    private readonly recordingContentService: RecordingContentService,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    const { meeting_info, recording_files = [] } = payload;
    const { meeting_id, sub_meeting_id } = meeting_info;
    const creatorUserId = meeting_info.creator.userid || '';

    for (const file of recording_files) {
      const fileId = file.record_file_id;

      try {
        // 获取智能摘要
        let fullsummary = '';
        // 获取录音转写内容
        const [meetingContentResult] = await Promise.allSettled([
          this.recordingContentService.fetchSmartSummary(fileId, creatorUserId),
        ]);

        // 处理会议内容结果
        if (meetingContentResult.status === 'fulfilled') {
          fullsummary = meetingContentResult.value;
        } else {
          this.logger.warn(`获取会议内容失败: ${fileId}`);
        }
      } catch (error) {
        this.logger.error(`处理录音文件 ${fileId} 时出错`, error);
      }
    }
  }
}
