import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSignature } from './crypto.util';
import {
  RecordingDetail,
  RecordMeetingsResponse,
  MeetingParticipantsResponse,
  MeetingDetailResponse,
  RecordingTranscriptDetail,
  SmartMinutesResponse,
  SmartSummaryResponse,
  SmartTopicsResponse,
} from './types';

@Injectable()
export class TencentApiService {
  private readonly BASE_URL = 'https://api.meeting.qq.com';

  constructor(private configService: ConfigService) {}

  private getConfig() {
    return {
      secretId:
        this.configService.get<string>('TENCENT_MEETING_SECRET_ID') || '',
      secretKey:
        this.configService.get<string>('TENCENT_MEETING_SECRET_KEY') || '',
      appId: this.configService.get<string>('TENCENT_MEETING_APP_ID') || '',
      sdkId: this.configService.get<string>('TENCENT_MEETING_SDK_ID') || '',
      userId: this.configService.get<string>('USER_ID') || '',
    };
  }

  private async sendRequest<T>(
    method: string,
    requestUri: string,
    queryParams: Record<string, unknown> = {},
  ): Promise<T> {
    try {
      const queryString = new URLSearchParams(
        queryParams as Record<string, string>,
      ).toString();
      const fullRequestUri = queryString
        ? `${requestUri}?${queryString}`
        : requestUri;
      const apiUrl = `${this.BASE_URL}${fullRequestUri}`;

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = Math.floor(Math.random() * 100000).toString();
      const config = this.getConfig();

      const signature = generateSignature(
        config.secretKey,
        method,
        config.secretId,
        nonce,
        timestamp,
        fullRequestUri,
        '',
      );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-TC-Key': config.secretId || '',
        'X-TC-Timestamp': timestamp,
        'X-TC-Nonce': nonce,
        'X-TC-Signature': signature,
        AppId: config.appId || '',
        SdkId: config.sdkId || '',
        'X-TC-Registered': '1',
      };

      const response = await fetch(apiUrl, {
        method,
        headers,
      });

      const responseData = (await response.json()) as {
        error_info?: {
          error_code?: number;
          new_error_code?: number;
          message?: string;
        };
      } & T;

      if (responseData.error_info) {
        this.handleApiError(responseData.error_info, fullRequestUri, timestamp);
      }

      return responseData;
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('API请求失败:', error);
      throw error;
    }
  }

  private handleApiError(
    errorInfo: {
      error_code?: number;
      new_error_code?: number;
      message?: string;
    },
    requestUri: string,
    timestamp: string,
  ): never {
    const { error_code, new_error_code, message } = errorInfo;
    const code = new_error_code ?? error_code ?? 0;

    if (code === 500125) {
      throw new Error('IP白名单错误');
    }

    throw new Error(message || `API error at ${requestUri} (${timestamp})`);
  }

  async getRecordingFileDetail(
    fileId: string,
    userId: string,
  ): Promise<RecordingDetail> {
    return this.sendRequest<RecordingDetail>(
      'GET',
      `/v1/addresses/${fileId}`,
      { userid: userId },
    );
  }

  async getCorpRecords(
    startTime: number,
    endTime: number,
    pageSize: number = 10,
    page: number = 1,
    operatorId?: string,
    operatorIdType: number = 1,
  ): Promise<RecordMeetingsResponse> {
    const maxRange = 31 * 24 * 60 * 60;
    if (endTime - startTime > maxRange) {
      throw new Error('时间区间不允许超过31天');
    }
    const size = Math.min(pageSize, 20);

    return this.sendRequest<RecordMeetingsResponse>('GET', '/v1/corp/records', {
      start_time: startTime,
      end_time: endTime,
      page_size: size,
      page,
      operator_id: operatorId,
      operator_id_type: operatorIdType,
    });
  }

  async getMeetingDetail(
    meetingId: string,
    userId: string,
    instanceId: string = '1',
  ): Promise<MeetingDetailResponse> {
    return this.sendRequest<MeetingDetailResponse>(
      'GET',
      `/v1/meetings/${meetingId}`,
      { userid: userId, instanceid: instanceId },
    );
  }

  async getMeetingParticipants(
    meetingId: string,
    userId: string,
    subMeetingId?: string | null,
  ): Promise<MeetingParticipantsResponse> {
    return this.sendRequest<MeetingParticipantsResponse>(
      'GET',
      `/v1/meetings/${meetingId}/participants`,
      { userid: userId, sub_meeting_id: subMeetingId ?? undefined },
    );
  }

  async getRecordingTranscriptDetail(
    fileId: string,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<RecordingTranscriptDetail> {
    return this.sendRequest<RecordingTranscriptDetail>(
      'GET',
      `/v1/recording/${fileId}/transcripts`,
      { userid: userId, page, page_size: pageSize },
    );
  }

  async getSmartMinutes(
    fileId: string,
    userId: string,
  ): Promise<SmartMinutesResponse> {
    return this.sendRequest<SmartMinutesResponse>(
      'GET',
      `/v1/recording/${fileId}/minutes`,
      { userid: userId },
    );
  }

  async getSmartSummary(
    fileId: string,
    userId: string,
  ): Promise<SmartSummaryResponse> {
    return this.sendRequest<SmartSummaryResponse>(
      'GET',
      `/v1/recording/${fileId}/summary`,
      { userid: userId },
    );
  }

  async getSmartTopics(
    fileId: string,
    userId: string,
  ): Promise<SmartTopicsResponse> {
    return this.sendRequest<SmartTopicsResponse>(
      'GET',
      `/v1/recording/${fileId}/topics`,
      { userid: userId },
    );
  }
}

