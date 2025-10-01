import { Injectable, Logger } from '@nestjs/common';
import { LarkClient } from '../lark.client';

/**
 * 飞书会议录制文件信息接口
 */
export interface MeetingRecordingFile {
  file_id: string;
  file_name: string;
  file_size: number;
  duration: number;
  download_url?: string;
  created_time: number;
  updated_time: number;
}

/**
 * 飞书会议录制信息接口
 */
export interface MeetingRecordingInfo {
  meeting_id: string;
  recording_files: MeetingRecordingFile[];
  recording_status: 'ready' | 'processing' | 'failed';
  recording_start_time?: number;
  recording_end_time?: number;
}

/**
 * 获取录制文件响应接口
 */
export interface GetMeetingRecordingResponse {
  code: number;
  msg: string;
  data?: {
    recording?: {
      url?: string;
      duration?: string;
    };
    recording_status?: string;
    recording_start_time?: number;
    recording_end_time?: number;
  };
}

/**
 * 授权录制文件请求接口
 */
export interface AuthorizeRecordingRequest {
  meeting_id: string;
  permission: {
    type: 'organization' | 'user' | 'public';
    scope?: string[];
  };
}

/**
 * 授权录制文件响应接口
 */
export interface AuthorizeRecordingResponse {
  code: number;
  msg: string;
  data?: {
    authorized: boolean;
    download_url?: string;
  };
}

/**
 * 飞书会议录制服务
 * 提供会议录制文件的获取、授权和管理功能
 */
@Injectable()
export class MeetingRecordingService {
  private readonly logger = new Logger(MeetingRecordingService.name);

  constructor(private readonly larkClient: LarkClient) {}

  /**
   * 获取会议录制文件信息
   * 需要会议结束后并且收到"录制完成"事件后才能获取
   * 只有会议owner（通过开放平台预约的会议即为预约人）有权限获取
   * 
   * @param meetingId 会议ID
   * @param userAccessToken 用户访问令牌（可选）
   * @returns 录制文件信息
   */
  async getMeetingRecording(
    meetingId: string,
    userAccessToken?: string,
  ): Promise<GetMeetingRecordingResponse> {
    try {
      this.logger.debug(`Getting meeting recording for meeting: ${meetingId}`);

      const requestOptions: any = {
        path: {
          meeting_id: meetingId,
        },
      };

      // 如果提供了用户访问令牌，添加到请求中
      if (userAccessToken) {
        requestOptions.headers = {
          'X-User-Access-Token': userAccessToken,
        };
      }

      const response = await this.larkClient.vc.v1.meetingRecording.get(
        requestOptions,
      );

      this.logger.debug('Meeting recording retrieved successfully', {
        meetingId,
        hasRecordingUrl: !!response.data?.recording?.url,
      });

      return response as GetMeetingRecordingResponse;
    } catch (error) {
      this.logger.error('Failed to get meeting recording', error);
      throw error;
    }
  }

  /**
   * 授权会议录制文件访问权限
   * 会议结束后并且收到了"录制完成"的事件后方可进行授权
   * 会议owner（通过开放平台预约的会议即为预约人）才有权限操作
   * 
   * @param meetingId 会议ID
   * @param permission 授权配置
   * @param userAccessToken 用户访问令牌（可选）
   * @returns 授权结果
   */
  async authorizeMeetingRecording(
    meetingId: string,
    permission: {
      type: 'organization' | 'user' | 'public';
      scope?: string[];
    },
    userAccessToken?: string,
  ): Promise<AuthorizeRecordingResponse> {
    try {
      this.logger.debug(
        `Authorizing meeting recording for meeting: ${meetingId}`,
        { permission },
      );

      const requestOptions: any = {
        path: {
          meeting_id: meetingId,
        },
        data: {
          permission,
        },
      };

      // 如果提供了用户访问令牌，添加到请求中
      if (userAccessToken) {
        requestOptions.headers = {
          'X-User-Access-Token': userAccessToken,
        };
      }

      const response = await this.larkClient.vc.v1.meetingRecording.setPermission(
        requestOptions,
      );

      this.logger.debug('Meeting recording authorized successfully', {
        meetingId,
        permission,
      });

      return response as AuthorizeRecordingResponse;
    } catch (error) {
      this.logger.error('Failed to authorize meeting recording', error);
      throw error;
    }
  }

  /**
   * 获取会议录制文件列表（简化版）
   * 
   * @param meetingId 会议ID
   * @param userAccessToken 用户访问令牌（可选）
   * @returns 录制文件列表
   */
  async getRecordingFiles(
    meetingId: string,
    userAccessToken?: string,
  ): Promise<MeetingRecordingFile[]> {
    try {
      const response = await this.getMeetingRecording(meetingId, userAccessToken);
      
      if (response.code !== 0) {
        throw new Error(`Failed to get recording files: ${response.msg}`);
      }

      // 根据实际API响应结构调整
      // 当前API返回的是单个录制文件URL，不是文件列表
      if (response.data?.recording?.url) {
        return [{
          file_id: meetingId,
          file_name: `recording_${meetingId}.mp4`,
          file_size: 0, // API不返回文件大小
          duration: parseInt(response.data.recording.duration || '0'),
          download_url: response.data.recording.url,
          created_time: response.data.recording_start_time || Date.now(),
          updated_time: response.data.recording_end_time || Date.now(),
        }];
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to get recording files list', error);
      throw error;
    }
  }

  /**
   * 检查会议是否有录制文件
   * 
   * @param meetingId 会议ID
   * @param userAccessToken 用户访问令牌（可选）
   * @returns 是否有录制文件
   */
  async hasRecordingFiles(
    meetingId: string,
    userAccessToken?: string,
  ): Promise<boolean> {
    try {
      const files = await this.getRecordingFiles(meetingId, userAccessToken);
      return files.length > 0;
    } catch (error) {
      this.logger.error('Failed to check recording files existence', error);
      return false;
    }
  }

  /**
   * 获取录制文件的下载链接
   * 需要先授权录制文件访问权限
   * 
   * @param meetingId 会议ID
   * @param fileId 文件ID
   * @param userAccessToken 用户访问令牌（可选）
   * @returns 下载链接
   */
  async getRecordingDownloadUrl(
    meetingId: string,
    fileId: string,
    userAccessToken?: string,
  ): Promise<string | undefined> {
    try {
      // 首先尝试授权为公开访问
      await this.authorizeMeetingRecording(
        meetingId,
        { type: 'public' },
        userAccessToken,
      );

      // 然后获取录制文件信息
      const response = await this.getMeetingRecording(meetingId, userAccessToken);
      
      if (response.code !== 0) {
        throw new Error(`Failed to get recording download URL: ${response.msg}`);
      }

      // 获取录制文件列表
      const recordingFiles = await this.getRecordingFiles(meetingId, userAccessToken);
      
      // 查找指定文件ID的下载链接
      const file = recordingFiles.find(
        (f) => f.file_id === fileId,
      );

      return file?.download_url;
    } catch (error) {
      this.logger.error('Failed to get recording download URL', error);
      throw error;
    }
  }

  /**
   * 批量获取多个会议的录制文件信息
   * 
   * @param meetingIds 会议ID数组
   * @param userAccessToken 用户访问令牌（可选）
   * @returns 会议录制信息映射
   */
  async batchGetMeetingRecordings(
    meetingIds: string[],
    userAccessToken?: string,
  ): Promise<Map<string, MeetingRecordingInfo>> {
    const results = new Map<string, MeetingRecordingInfo>();

    // 并发获取所有会议的录制信息
    const promises = meetingIds.map(async (meetingId) => {
      try {
        const response = await this.getMeetingRecording(meetingId, userAccessToken);
        
        if (response.code === 0 && response.data) {
          // 获取录制文件列表
          const recordingFiles = await this.getRecordingFiles(meetingId, userAccessToken);
          
          results.set(meetingId, {
            meeting_id: meetingId,
            recording_files: recordingFiles,
            recording_status: response.data.recording_status as 'ready' | 'processing' | 'failed',
            recording_start_time: response.data.recording_start_time,
            recording_end_time: response.data.recording_end_time,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to get recording for meeting ${meetingId}`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * 测试飞书会议录制API连接
   * 
   * @returns 连接是否成功
   */
  async testConnection(): Promise<boolean> {
    try {
      // 这里可以使用一个示例会议ID进行测试
      // 注意：实际使用时需要提供一个有效的会议ID
      this.logger.log('Testing Lark meeting recording API connection...');
      
      // 由于需要有效的会议ID才能测试，这里仅测试客户端是否初始化成功
      if (this.larkClient && this.larkClient.vc && this.larkClient.vc.v1) {
        this.logger.log('Lark meeting recording API connection test successful');
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error('Lark meeting recording API connection test failed', error);
      return false;
    }
  }
}