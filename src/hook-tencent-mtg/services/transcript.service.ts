/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-24 00:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-24 19:05:00
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/transcript.service.ts
 * @Description: 转写服务，负责获取和格式化录音转写内容
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable, Logger } from '@nestjs/common';
import { TencentApiService } from '@/integrations/tencent-meeting/api.service';
import { RecordingTranscriptResponse } from '@/integrations/tencent-meeting/types';
import { TranscriptFormatterService } from './transcript-formatter.service';

/**
 * 转写结果接口
 */
export interface TranscriptResult {
  transcriptResponse: RecordingTranscriptResponse | null;
  uniqueUsernames: string[];
  formattedTranscript: string;
}

/**
 * 转写服务
 * 负责获取和格式化录音转写内容
 */
@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);

  constructor(
    private readonly tencentMeetingApi: TencentApiService,
    private readonly transcriptFormatterService: TranscriptFormatterService,
  ) {}

  /**
   * 获取录音转写内容
   * @param recordFileId 录制文件ID
   * @param userId 用户ID
   * @returns 包含原始响应、唯一用户名和格式化转写的结果
   */
  async getTranscript(
    recordFileId: string,
    userId: string,
  ): Promise<TranscriptResult> {
    const startTime = Date.now();
    const context = { recordFileId, userId };

    this.logger.log('开始获取录音转写', context);

    try {
      // 获取转写数据
      const transcriptResponse = await this.tencentMeetingApi.getTranscript(
        recordFileId,
        userId,
      );

      // 提取唯一用户名
      const uniqueUsernames = this.extractUniqueUsernames(transcriptResponse);

      // 格式化转写内容
      const formattedTranscript =
        this.transcriptFormatterService.formatTranscript(transcriptResponse);

      const duration = Date.now() - startTime;
      this.logger.log('获取录音转写成功', {
        ...context,
        duration,
        uniqueUsernamesCount: uniqueUsernames.length,
        formattedLinesCount: formattedTranscript
          ? formattedTranscript.split('\n\n').length
          : 0,
      });

      return {
        transcriptResponse,
        uniqueUsernames,
        formattedTranscript,
      };
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.warn('获取录音转写失败', {
        ...context,
        error: errorMessage,
      });

      // 返回空结果而不是抛出错误，以保持主流程继续
      return {
        transcriptResponse: null,
        uniqueUsernames: [],
        formattedTranscript: '',
      };
    }
  }

  /**
   * 提取唯一用户名
   * @param transcriptResponse 转写响应数据
   * @returns 唯一用户名数组
   */
  private extractUniqueUsernames(
    transcriptResponse?: RecordingTranscriptResponse,
  ): string[] {
    if (!transcriptResponse?.minutes?.paragraphs) {
      return [];
    }

    const uniqueUsernames = new Set<string>();

    for (const paragraph of transcriptResponse.minutes.paragraphs) {
      const speakerName = paragraph.speaker_info?.username || '未知发言人';
      uniqueUsernames.add(speakerName);
    }

    return Array.from(uniqueUsernames);
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
