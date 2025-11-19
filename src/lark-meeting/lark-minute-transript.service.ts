/**
 * MinuteTranscriptService（纪要转写服务）
 *
 * 职责：
 * - 通过 Lark Minutes API 获取指定 `minuteToken` 的纪要转写文件（支持 txt/srt）
 * - 以可读流的方式下载内容并写入本地 `transcripts/` 目录
 * - 将转写文本写入到 Bitable 的录制文件表（只保存文本，不包含参与者）
 *
 * 设计要点：
 * - 使用 `LarkClient.getClient()` 取得原生 SDK 客户端，以获取响应流
 * - 通过文件存在性检查避免重复拉取与写入
 * - 上层调用方可按需在后续流程补充 `participants` 字段
 */
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LarkClient } from '@lark/lark.client';
import { RecordingFileBitableRepository } from '@lark/repositories/meeting-recording-file.repository';
import { RecordingFileData } from '@lark/types/recording-file.types';

@Injectable()
export class MinuteTranscriptService {
  constructor(
    private readonly larkClient: LarkClient,
    private readonly recordingFileBitableRepository: RecordingFileBitableRepository,
  ) {}

  async saveTranscript(
    minuteToken: string,
    fileFormat: 'txt' | 'srt' = 'txt',
  ): Promise<void> {
    // 预先计算文件路径，若已存在则直接跳过，避免重复获取与写入
    const fileName = `${minuteToken}.${fileFormat}`;
    const filePath = path.resolve(process.cwd(), 'transcripts', fileName);
    const exists = await fs.promises
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      console.warn('转写文件已存在，跳过重复获取与写入:', fileName);
      return;
    }

    const response = await this.larkClient.minutes.v1.minuteTranscript.get({
      path: {
        minute_token: minuteToken,
      },
      params: {
        file_format: fileFormat,
        need_speaker: true,
        need_timestamp: true,
      },
    });
    if (!response) {
      throw new Error('Failed to fetch transcript from Lark API');
    }

    // Get readable stream from response
    const transcriptStream = response.getReadableStream();
    const chunks: Buffer[] = [];
    for await (const chunk of transcriptStream) {
      chunks.push(chunk);
    }
    const fileContent = Buffer.concat(chunks);

    // 写入文件（目录确保存在，文件存在则已在前面跳过）
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, fileContent);

    // Build RecordingFileData object（只保存转写文本，不包含 participants）
    const recordingFileData: RecordingFileData = {
      record_file_id: minuteToken,
      ai_meeting_transcripts: fileContent.toString(),
      meet: [],
    };

    // 写入（upsert）到 Bitable
    await this.recordingFileBitableRepository.upsertRecordingFileRecord(
      recordingFileData,
    );
  }
}
