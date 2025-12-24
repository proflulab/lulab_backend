/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-24 00:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-24 00:00:00
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/recording-content.service.ts
 * @Description: 录制内容服务，负责获取会议内容（摘要、纪要、转写等）
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable, Logger } from '@nestjs/common';
import { TencentApiService } from '@/integrations/tencent-meeting/api.service';

/**
 * 会议内容接口
 */
export interface MeetingContent {
  fullsummary: string;
  todo: string;
  ai_minutes: string;
  transcript: any;
}

/**
 * 录制内容服务
 * 负责获取会议内容（摘要、纪要、转写等）
 */
@Injectable()
export class RecordingContentService {
  private readonly logger = new Logger(RecordingContentService.name);

  constructor(private readonly tencentMeetingApi: TencentApiService) {}

  /**
   * 获取会议内容（摘要、纪要、转写等）
   * @param recordFileId 录制文件ID
   * @param userId 用户ID
   * @returns 会议内容
   */
  async getMeetingContent(
    recordFileId: string,
    userId: string,
  ): Promise<MeetingContent> {
    const result: MeetingContent = {
      fullsummary: '',
      todo: '',
      ai_minutes: '',
      transcript: null,
    };

    // 获取智能全文摘要
    try {
      const summaryResponse = await this.tencentMeetingApi.getSmartFullSummary(
        recordFileId,
        userId,
      );
      result.fullsummary =
        Buffer.from(summaryResponse.ai_summary, 'base64').toString('utf-8') ||
        '';
      this.logger.log(`获取智能摘要成功: ${recordFileId}`);
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.warn(
        `获取智能摘要失败: ${recordFileId}, 错误: ${errorMessage}`,
      );
    }

    // 获取智能会议纪要（包含待办事项）
    try {
      const minutesResponse =
        await this.tencentMeetingApi.getSmartMeetingMinutes(
          recordFileId,
          userId,
        );
      result.ai_minutes = minutesResponse.meeting_minute?.minute || '';
      result.todo = minutesResponse.meeting_minute?.todo || '';
      this.logger.log(`获取会议纪要成功: ${recordFileId}`);
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.warn(
        `获取会议纪要失败: ${recordFileId}, 错误: ${errorMessage}`,
      );
    }

    // 获取录音转写内容
    try {
      result.transcript = await this.tencentMeetingApi.getTranscript(
        recordFileId,
        userId,
      );
      this.logger.log(`获取录音转写成功: ${recordFileId}`);
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.warn(
        `获取录音转写失败: ${recordFileId}, 错误: ${errorMessage}`,
      );
    }

    return result;
  }

  /**
   * 获取错误消息
   * @param error 错误对象
   * @returns 错误消息字符串
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
