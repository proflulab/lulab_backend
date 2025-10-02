import { Injectable, Logger } from '@nestjs/common';
import { LarkClient } from '../lark.client'; // 你自己的 LarkClient

/**
 * 飞书会议录制文件信息接口
 */
export interface MeetingRecordingFile {
  url?: string;
  duration?: string;
}

/**
 * 获取会议录制文件响应接口
 */
export interface GetMeetingRecordingResponse {
  recording?: MeetingRecordingFile;
}


@Injectable()
export class MeetingRecordingService {
  private readonly logger = new Logger(MeetingRecordingService.name);

  constructor(private readonly larkClient: LarkClient) {}

  /**
   * 获取会议录制文件信息（无需 TenantToken）
   * @param meetingId 会议ID
   */
  async getMeetingRecording(meetingId: string): Promise<GetMeetingRecordingResponse> {
    try {
      const response = await this.larkClient.vc.v1.meetingRecording.get({
        path: { meeting_id: meetingId },
      });

      this.logger.debug(`Meeting recording retrieved for ${meetingId}`);

      // return response.data;
      // 给默认值，确保返回值不为 undefined
      return response.data ?? {};
    } catch (error: any) {
      this.logger.error('Failed to get meeting recording', error);
      throw error;
    }
  }
}
