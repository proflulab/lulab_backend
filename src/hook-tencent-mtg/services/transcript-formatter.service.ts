/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-24 00:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-24 08:24:20
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/transcript-formatter.service.ts
 * @Description: 转写格式化服务，负责格式化录音转写内容
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  RecordingTranscriptResponse,
  RecordingTranscriptSentence,
  RecordingTranscriptWord,
} from '@/integrations/tencent-meeting/types';

/**
 * 格式化后的转写结果
 */
export interface FormattedTranscriptResult {
  formattedText: string;
  uniqueUsernames: Set<string>;
}

/**
 * 转写格式化服务
 * 负责格式化录音转写内容
 */
@Injectable()
export class TranscriptFormatterService {
  private readonly logger = new Logger(TranscriptFormatterService.name);

  /**
   * 格式化转写内容
   * @param transcript 转写响应数据
   * @returns 格式化后的转写文本和唯一用户名
   */
  formatTranscript(transcript?: RecordingTranscriptResponse): string {
    if (!transcript?.minutes?.paragraphs) {
      return '';
    }

    const uniqueUsernames = new Set<string>();
    const formattedLines: string[] = [];

    // 提取所有唯一的用户名
    for (const paragraph of transcript.minutes.paragraphs) {
      const speakerName = paragraph.speaker_info?.username || '未知发言人';
      uniqueUsernames.add(speakerName);
    }

    // 格式化转写内容为指定格式 - 将每个段落的所有句子组合成段落
    for (const paragraph of transcript.minutes.paragraphs) {
      const speakerName = paragraph.speaker_info?.username || '未知发言人';

      // 转换第一个句子的时间戳为小时:分钟:秒格式
      const firstSentence = paragraph.sentences[0];
      if (firstSentence) {
        const startTime = firstSentence.start_time;
        const timeString = this.formatTimestamp(startTime);

        // 将段落中的所有句子组合成一个段落文本
        const paragraphText = paragraph.sentences
          .map((sentence: RecordingTranscriptSentence) =>
            sentence.words
              .map((word: RecordingTranscriptWord) => word.text)
              .join(''),
          )
          .join('')
          .trim();

        // 即使文本为空，也要添加格式化行（为了保持时间戳信息）
        formattedLines.push(`${speakerName}(${timeString})：${paragraphText}`);
      }
    }

    const formattedTranscript = formattedLines.join('\n\n');
    this.logger.log(
      `格式化转写成功, 共 ${formattedLines.length} 条记录, 提取到 ${uniqueUsernames.size} 个唯一用户名`,
    );

    return formattedTranscript;
  }

  /**
   * 格式化时间戳为 HH:MM:SS 格式
   * @param timestamp 时间戳（毫秒）
   * @returns 格式化后的时间字符串
   */
  private formatTimestamp(timestamp: number): string {
    const hours = Math.floor(timestamp / 3600000); // 转换为小时
    const minutes = Math.floor((timestamp % 3600000) / 60000); // 剩余的分钟
    const seconds = Math.floor((timestamp % 60000) / 1000); // 剩余的秒

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
