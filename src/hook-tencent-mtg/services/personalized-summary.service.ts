/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-24 00:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-24 08:01:58
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/personalized-summary.service.ts
 * @Description: 个性化总结服务，负责生成个性化会议总结
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable, Logger } from '@nestjs/common';
import { MeetingParticipantDetail } from '@/integrations/tencent-meeting/types';
import {
  MeetingUserBitableRepository,
  NumberRecordBitableRepository,
} from '@/integrations/lark/repositories';
import { OpenaiService } from '@/integrations/openai/openai.service';
import { MeetingContent } from './recording-content.service';
import { PARTICIPANT_SUMMARY_PROMPT } from '../constants/prompts';

/**
 * 个性化总结服务
 * 负责生成个性化会议总结
 */
@Injectable()
export class PersonalizedSummaryService {
  private readonly logger = new Logger(PersonalizedSummaryService.name);

  constructor(private readonly openaiService: OpenaiService) {}

  /**
   * 为参会者生成个性化总结
   * @param meetingInfo 会议信息
   * @param participants 参与者列表
   * @param meetingContent 会议内容
   * @param formattedTranscript 格式化后的转写内容
   * @param recordingFileId 录制文件记录ID
   * @param meetingUserBitable 用户记录仓库
   * @param numberRecordBitable 数字记录仓库
   */
  async generatePersonalizedSummaries(
    meetingInfo: any,
    participants: MeetingParticipantDetail[],
    meetingContent: MeetingContent,
    formattedTranscript: string,
    recordingFileId: string,
    meetingUserBitable: MeetingUserBitableRepository,
    numberRecordBitable: NumberRecordBitableRepository,
  ): Promise<void> {
    // 从转写内容中提取唯一用户名
    const uniqueUsernames = this.extractUniqueUsernames(formattedTranscript);

    this.logger.log(
      `开始对参会者进行个性化会议总结, 共 ${uniqueUsernames.size} 个参与者`,
    );

    for (const username of uniqueUsernames) {
      try {
        // 根据username的值匹配participants的user_name来获取uuid
        const participant = participants.find((p) => p.user_name === username);

        let participantRecordIds: string[] = [];

        if (participant) {
          try {
            // 通过uuid请求获取记录id
            const searchResult =
              await meetingUserBitable.searchMeetingUserByUuid(
                participant.uuid,
              );

            // 解析搜索结果获取记录ID
            const searchData = searchResult as {
              data?: { items?: Array<{ record_id: string }> };
            };

            if (searchData.data?.items && searchData.data.items.length > 0) {
              participantRecordIds = searchData.data.items.map(
                (item) => item.record_id,
              );
              this.logger.log(
                `找到参会者记录: ${username} (uuid: ${participant.uuid}), 记录ID: ${participantRecordIds.join(', ')}`,
              );
            } else {
              this.logger.warn(
                `未找到参会者记录: ${username} (uuid: ${participant.uuid})`,
              );
            }
          } catch (error: unknown) {
            const errorMessage = this.getErrorMessage(error);
            this.logger.warn(
              `搜索参会者记录失败: ${username}, 错误: ${errorMessage}`,
            );
          }
        } else {
          this.logger.warn(`在会议参与者中未找到匹配的用户: ${username}`);
        }

        // 构建参会者的会议总结提示词
        const participantSummaryPrompt = this.buildSummaryPrompt(
          meetingInfo,
          username,
          meetingContent,
          formattedTranscript,
        );

        // 调用OpenAI生成个性化总结
        const participantSummary = await this.openaiService.ask(
          participantSummaryPrompt,
          '你是专业的会议总结助手，擅长为参会者提供个性化、实用的会议总结。',
        );

        this.logger.log(`生成参会者总结成功: ${username}`);

        // 保存参会者总结到number_record表，填入记录id
        await numberRecordBitable.upsertNumberRecord({
          meet_participant: participantRecordIds,
          participant_summary: participantSummary,
          record_file: [recordingFileId],
        });

        this.logger.log(`参会者总结记录已保存: ${username}`);
      } catch (error: unknown) {
        const errorMessage = this.getErrorMessage(error);
        this.logger.warn(
          `生成参会者总结失败: ${username}, 错误: ${errorMessage}`,
        );
      }
    }
  }

  /**
   * 从格式化后的转写内容中提取唯一用户名
   * @param formattedTranscript 格式化后的转写内容
   * @returns 唯一用户名集合
   */
  private extractUniqueUsernames(formattedTranscript: string): Set<string> {
    const uniqueUsernames = new Set<string>();

    if (!formattedTranscript) {
      return uniqueUsernames;
    }

    // 使用正则表达式匹配用户名模式：用户名(时间)：
    const usernameRegex = /^(.+?)\(\d{2}:\d{2}:\d{2}\)：/gm;
    let match;

    while ((match = usernameRegex.exec(formattedTranscript)) !== null) {
      uniqueUsernames.add(match[1]);
    }

    return uniqueUsernames;
  }

  /**
   * 构建参会者的会议总结提示词
   * @param meetingInfo 会议信息
   * @param username 参会者用户名
   * @param meetingContent 会议内容
   * @param formattedTranscript 格式化后的转写内容
   * @returns 构建好的提示词
   */
  private buildSummaryPrompt(
    meetingInfo: any,
    username: string,
    meetingContent: MeetingContent,
    formattedTranscript: string,
  ): string {
    return PARTICIPANT_SUMMARY_PROMPT(
      meetingInfo.subject,
      new Date(meetingInfo.start_time * 1000).toLocaleString(),
      new Date(meetingInfo.end_time * 1000).toLocaleString(),
      username,
      meetingContent.ai_minutes || '暂无会议纪要',
      meetingContent.todo || '暂无待办事项',
      formattedTranscript || '暂无录音转写',
    );
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
