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

/**
 * Tencent Meeting API Service
 * Provides methods to interact with Tencent Meeting API endpoints
 * Handles authentication, request signing, and error handling
 */
@Injectable()
export class TencentApiService {
  private readonly BASE_URL = 'https://api.meeting.qq.com';

  constructor(private configService: ConfigService) {}

  /**
   * Retrieves Tencent Meeting API configuration from environment variables
   * @returns Configuration object containing API credentials and settings
   */
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

  /**
   * Sends authenticated HTTP request to Tencent Meeting API
   * Handles signature generation, header setup, and response processing
   * @param method - HTTP method (GET, POST, etc.)
   * @param requestUri - API endpoint path
   * @param queryParams - Query parameters for the request
   * @returns Promise resolving to response data of type T
   * @throws Error if API request fails or returns error response
   */
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
      console.error('API请求失败:', error);
      throw error;
    }
  }

  /**
   * Handles API error responses from Tencent Meeting API
   * Processes error codes and throws appropriate error messages
   * @param errorInfo - Error information from API response
   * @param requestUri - The API endpoint that caused the error
   * @param timestamp - Request timestamp for debugging
   * @throws Error with detailed error message
   */
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

  /**
   * Retrieves detailed information about a recording file
   * @param fileId - Unique identifier of the recording file
   * @param userId - User ID making the request
   * @returns Promise resolving to recording file details
   */
  async getRecordingFileDetail(
    fileId: string,
    userId: string,
  ): Promise<RecordingDetail> {
    return this.sendRequest<RecordingDetail>('GET', `/v1/addresses/${fileId}`, {
      userid: userId,
    });
  }

  /**
   * Retrieves corporate meeting records within a specified time range
   * Supports pagination and filtering by operator
   * @param startTime - Start timestamp (Unix timestamp in seconds)
   * @param endTime - End timestamp (Unix timestamp in seconds)
   * @param pageSize - Number of records per page (max 20, default 10)
   * @param page - Page number (default 1)
   * @param operatorId - Optional operator ID for filtering
   * @param operatorIdType - Operator ID type (default 1)
   * @returns Promise resolving to paginated meeting records
   * @throws Error if time range exceeds 31 days
   */
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

  /**
   * Retrieves detailed information about a specific meeting
   * @param meetingId - Unique meeting identifier
   * @param userId - User ID making the request
   * @param instanceId - Meeting instance ID (default '1')
   * @returns Promise resolving to meeting details
   */
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

  /**
   * Retrieves participant list for a specific meeting
   * https://cloud.tencent.com/document/product/1095/42701#7d24527a-e594-4213-95ad-27640a0c49c9
   * @param meetingId - Unique meeting identifier
   * @param userId - User ID making the request
   * @param subMeetingId - Optional sub-meeting ID for recurring meetings
   * @param pos - Pagination starting position for participant list query
   * @param size - Number of participants to retrieve per page (max 100)
   * @param startTime - Filter by participant join start time (Unix timestamp in seconds)
   * @param endTime - Filter by participant join end time (Unix timestamp in seconds)
   * @returns Promise resolving to meeting participants list
   */
  async getMeetingParticipants(
    meetingId: string,
    userId: string,
    subMeetingId?: string | null,
    pos?: number,
    size?: number,
    startTime?: number,
    endTime?: number,
  ): Promise<MeetingParticipantsResponse> {
    const queryParams: Record<string, unknown> = {
      userid: userId,
      sub_meeting_id: subMeetingId ?? undefined,
    };

    // Add pagination parameters if provided
    if (pos !== undefined) {
      queryParams.pos = pos;
    }
    if (size !== undefined) {
      queryParams.size = Math.min(size, 100); // Ensure size doesn't exceed 100
    }

    // Add time filter parameters if provided
    if (startTime !== undefined) {
      queryParams.start_time = startTime;
    }
    if (endTime !== undefined) {
      queryParams.end_time = endTime;
    }

    return this.sendRequest<MeetingParticipantsResponse>(
      'GET',
      `/v1/meetings/${meetingId}/participants`,
      queryParams,
    );
  }

  /**
   * Retrieves transcript details for a recording file with pagination
   * @param fileId - Unique identifier of the recording file
   * @param userId - User ID making the request
   * @param page - Page number for pagination
   * @param pageSize - Number of transcript entries per page
   * @returns Promise resolving to paginated transcript details
   */
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

  /**
   * Retrieves AI-generated meeting minutes for a recording
   * @param fileId - Unique identifier of the recording file
   * @param userId - User ID making the request
   * @returns Promise resolving to smart meeting minutes
   */
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

  /**
   * Retrieves AI-generated meeting summary for a recording
   * @param fileId - Unique identifier of the recording file
   * @param userId - User ID making the request
   * @returns Promise resolving to smart meeting summary
   */
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

  /**
   * Retrieves AI-generated discussion topics for a recording
   * @param fileId - Unique identifier of the recording file
   * @param userId - User ID making the request
   * @returns Promise resolving to smart discussion topics
   */
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
