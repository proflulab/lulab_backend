import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from './base-event.handler';
import { TencentEventPayload } from '../../types/tencent-webhook-events.types';

/**
 * 录制完成事件处理器
 */
@Injectable()
export class RecordingCompletedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'recording.completed';

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    const { meeting_info, recording_files = [] } = payload;

    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    // 记录会议信息
    this.logger.log(`录制完成 [${index}]: ${meeting_info.subject} (${meeting_info.meeting_code})`);

    try {
      await this.processRecordingFiles(meeting_info.meeting_id, recording_files);
    } catch (error) {
      this.logger.error(`处理录制完成事件失败: ${meeting_info.meeting_id}`, error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 处理录制文件
   */
  private async processRecordingFiles(meetingId: string, recordingFiles: any[]): Promise<void> {
    if (!recordingFiles || recordingFiles.length === 0) {
      this.logger.warn(`会议 ${meetingId} 没有录制文件`);
      return;
    }

    this.logger.log(`开始处理会议 ${meetingId} 的录制文件`, {
      fileCount: recordingFiles.length,
      files: recordingFiles.map(file => ({
        fileId: file.file_id,
        fileName: file.file_name,
        fileSize: file.file_size,
        downloadAddress: file.download_address,
        viewAddress: file.view_address,
        fileType: file.file_type
      }))
    });

    // TODO: 添加具体的录制文件处理逻辑
    // 例如：下载文件、上传到云存储、更新数据库记录等
    // await this.recordingService.processRecordingFiles(meetingId, recordingFiles);

    this.logger.log(`完成处理会议 ${meetingId} 的录制文件`);
  }
}