/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-24 00:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-24 18:53:49
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
  ai_minutes: string;
  todo: string;
}

/**
 * 错误类型枚举
 */
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  DECODING_ERROR = 'DECODING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 自定义错误类
 */
class MeetingContentError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'MeetingContentError';
  }
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
    const startTime = Date.now();
    const context = { recordFileId, userId };

    this.logger.log('开始获取会议内容', context);

    const result: MeetingContent = {
      fullsummary: '',
      todo: '',
      ai_minutes: '',
    };

    // 并行获取会议内容
    const [summaryResult, minutesResult] = await Promise.allSettled([
      this.fetchSmartSummary(recordFileId, userId),
      this.fetchMeetingMinutes(recordFileId, userId),
    ]);

    // 处理摘要结果
    if (summaryResult.status === 'fulfilled') {
      result.fullsummary = summaryResult.value;
      this.logger.log('获取智能摘要成功', {
        ...context,
        contentLength: result.fullsummary.length,
      });
    } else {
      this.handleApiError('获取智能摘要失败', summaryResult.reason, context);
    }

    // 处理纪要结果
    if (minutesResult.status === 'fulfilled') {
      result.ai_minutes = minutesResult.value.minutes;
      result.todo = minutesResult.value.todo;
      this.logger.log('获取会议纪要成功', {
        ...context,
        minutesLength: result.ai_minutes.length,
        todoLength: result.todo.length,
      });
    } else {
      this.handleApiError('获取会议纪要失败', minutesResult.reason, context);
    }

    const duration = Date.now() - startTime;
    this.logger.log('获取会议内容完成', { ...context, duration });

    return result;
  }

  /**
   * 获取智能摘要
   * @param recordFileId 录制文件ID
   * @param userId 用户ID
   * @returns 解码后的摘要内容
   */
  private async fetchSmartSummary(
    recordFileId: string,
    userId: string,
  ): Promise<string> {
    try {
      const response = await this.tencentMeetingApi.getSmartFullSummary(
        recordFileId,
        userId,
      );
      return this.decodeBase64Content(response.ai_summary);
    } catch (error) {
      throw new MeetingContentError(
        ErrorType.API_ERROR,
        `获取智能摘要失败: ${this.getErrorMessage(error)}`,
        error,
      );
    }
  }

  /**
   * 获取会议纪要
   * @param recordFileId 录制文件ID
   * @param userId 用户ID
   * @returns 包含纪要和待办事项的对象
   */
  private async fetchMeetingMinutes(
    recordFileId: string,
    userId: string,
  ): Promise<{ minutes: string; todo: string }> {
    try {
      const response = await this.tencentMeetingApi.getSmartMeetingMinutes(
        recordFileId,
        userId,
      );
      return {
        minutes: response.meeting_minute?.minute || '',
        todo: response.meeting_minute?.todo || '',
      };
    } catch (error) {
      throw new MeetingContentError(
        ErrorType.API_ERROR,
        `获取会议纪要失败: ${this.getErrorMessage(error)}`,
        error,
      );
    }
  }

  /**
   * 解码Base64内容
   * @param base64Content Base64编码的内容
   * @returns 解码后的字符串
   */
  private decodeBase64Content(base64Content: string): string {
    try {
      return base64Content
        ? Buffer.from(base64Content, 'base64').toString('utf-8')
        : '';
    } catch (error) {
      throw new MeetingContentError(
        ErrorType.DECODING_ERROR,
        `Base64解码失败: ${this.getErrorMessage(error)}`,
        error,
      );
    }
  }

  /**
   * 处理API错误
   * @param message 错误消息
   * @param error 错误对象
   * @param context 上下文信息
   */
  private handleApiError(
    message: string,
    error: unknown,
    context: Record<string, any>,
  ): void {
    const errorMessage = this.getErrorMessage(error);
    this.logger.warn(message, { ...context, error: errorMessage });
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
