import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSignature } from './tencent-crypto.service';
import {
    RecordingDetail,
    RecordMeetingsResponse,
    MeetingParticipantsResponse,
    MeetingDetailResponse,
    RecordingTranscriptDetail,
    SmartMinutesResponse,
    SmartSummaryResponse,
    SmartTopicsResponse
} from '../types/tencent-meeting-api.types';

@Injectable()
export class TencentApiService {
    private readonly BASE_URL = 'https://api.meeting.qq.com';
    
    constructor(
        private configService: ConfigService,
    ) { }

    private getConfig() {
        return {
            secretId: this.configService.get<string>('TENCENT_MEETING_SECRET_ID') || '',
            secretKey: this.configService.get<string>('TENCENT_MEETING_SECRET_KEY') || '',
            appId: this.configService.get<string>('TENCENT_MEETING_APP_ID') || '',
            sdkId: this.configService.get<string>('TENCENT_MEETING_SDK_ID') || '',
            userId: this.configService.get<string>('USER_ID') || ''
        };
    }

    /**
     * 发送腾讯会议API请求的基础方法
     * @param method HTTP方法
     * @param requestUri 请求URI
     * @param queryParams 查询参数
     * @returns API响应数据
     */
    private async sendRequest<T>(
        method: string,
        requestUri: string,
        queryParams: Record<string, any> = {}
    ): Promise<T> {
        try {
            // 构建完整的请求URI
            const queryString = new URLSearchParams(queryParams).toString();
            const fullRequestUri = queryString ? `${requestUri}?${queryString}` : requestUri;
            const apiUrl = `${this.BASE_URL}${fullRequestUri}`;

            // 准备请求头参数
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const nonce = Math.floor(Math.random() * 100000).toString();
            const config = this.getConfig();

            // 生成签名
            const signature = generateSignature(
                config.secretKey,
                method,
                config.secretId,
                nonce,
                timestamp,
                fullRequestUri,
                ''
            );

            // 构建请求头
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-TC-Key': config.secretId || '',
                'X-TC-Timestamp': timestamp,
                'X-TC-Nonce': nonce,
                'X-TC-Signature': signature,
                'AppId': config.appId || '',
                'SdkId': config.sdkId || '',
                'X-TC-Registered': '1'
            };

            const response = await fetch(apiUrl, {
                method,
                headers
            });

            const responseData = await response.json();

            // 统一错误处理
            if (responseData.error_info) {
                this.handleApiError(responseData.error_info, fullRequestUri, timestamp);
            }

            return responseData as T;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    /**
     * 统一处理API错误
     * @param errorInfo 错误信息
     * @param requestUri 请求URI
     * @param timestamp 时间戳
     */
    private handleApiError(errorInfo: any, requestUri: string, timestamp: string): void {
        console.error('API请求失败:', {
            错误码: errorInfo.error_code,
            新错误码: errorInfo.new_error_code,
            错误信息: errorInfo.message,
            请求URI: requestUri,
            时间戳: timestamp
        });

        // 特殊处理IP白名单错误
        if (errorInfo.error_code === 500125) {
            throw new Error(`IP白名单错误: ${errorInfo.message}\n请确保已在腾讯会议应用配置中添加当前服务器IP到白名单。`);
        }

        if (errorInfo.error_code === 108004051) {
            throw new Error(`录制文件已经被删除: ${errorInfo.message}\n`);
        }

        throw new Error(`API请求失败: ${errorInfo.message} (错误码: ${errorInfo.error_code})`);
    }

    /**
     * 获取录制文件详情
     * @param fileId 录制文件ID
     * @param userId 用户ID
     * @returns 录制详情信息
     */
    async getRecordingFileDetail(fileId: string, userId: string): Promise<RecordingDetail> {
        return this.sendRequest<RecordingDetail>('GET', `/v1/addresses/${fileId}`, { userid: userId });
    }

    /**
     * 获取账户级会议录制列表
     * @param startTime 查询起始时间戳（单位秒）
     * @param endTime 查询结束时间戳（单位秒）
     * @param pageSize 分页大小，默认10，最大20
     * @param page 页码，从1开始，默认1
     * @returns 会议录制列表响应
     */
    async getCorpRecords(
        startTime: number,
        endTime: number,
        pageSize: number = 10,
        page: number = 1,
        operatorId?: string,
        operatorIdType: number = 1
    ): Promise<RecordMeetingsResponse> {
        // 验证时间区间不超过31天
        if (endTime - startTime > 31 * 24 * 60 * 60) {
            throw new Error('时间区间不允许超过31天');
        }

        // 验证分页参数
        const validatedPageSize = Math.min(pageSize, 20); // 限制最大分页大小为20
        const config = this.getConfig();
        const finalOperatorId = operatorId || config.userId;

        return this.sendRequest<RecordMeetingsResponse>('GET', '/v1/corp/records', {
            start_time: startTime,
            end_time: endTime,
            page_size: validatedPageSize,
            page,
            operator_id: finalOperatorId,
            operator_id_type: operatorIdType
        });
    }

    /**
     * 获取会议详情
     * @param meetingId 会议ID
     * @param userId 用户ID
     * @param instanceId 实例ID，默认为"1"
     * @returns 会议详情响应
     */
    async getMeetingDetail(
        meetingId: string,
        userId: string,
        instanceId: string = "1"
    ): Promise<MeetingDetailResponse> {
        return this.sendRequest<MeetingDetailResponse>('GET', `/v1/meetings/${meetingId}`, {
            userid: userId,
            instanceid: instanceId
        });
    }

    /**
     * 获取会议参会成员列表
     * @param meetingId 会议ID
     * @param userId 用户ID
     * @param subMeetingId 子会议ID（可选）
     * @returns 参会成员列表响应
     */
    async getMeetingParticipants(
        meetingId: string,
        userId: string,
        subMeetingId?: string | null
    ): Promise<MeetingParticipantsResponse> {
        const params: Record<string, any> = { userid: userId };
        if (subMeetingId) {
            params.sub_meeting_id = subMeetingId;
        }

        return this.sendRequest<MeetingParticipantsResponse>('GET', `/v1/meetings/${meetingId}/participants`, params);
    }

    /**
     * 获取录制转写详情
     * @param meetingId 会议ID
     * @param recordFileId 录制文件ID
     * @param userId 用户ID
     * @param pid 查询的起始段落ID，可选，默认从0开始
     * @param limit 查询的段落数，可选，默认查询全量数据
     * @returns 录制转写详情信息
     */
    async getRecordingTranscriptDetail(
        meetingId: string,
        recordFileId: string,
        userId: string,
        pid?: string,
        limit?: number
    ): Promise<RecordingTranscriptDetail> {
        const params: Record<string, any> = {
            meeting_id: meetingId,
            record_file_id: recordFileId,
            operator_id: userId,
            operator_id_type: 1
        };

        if (pid !== undefined) {
            params.pid = pid;
        }
        if (limit !== undefined) {
            params.limit = limit;
        }

        return this.sendRequest<RecordingTranscriptDetail>('GET', '/v1/records/transcripts/details', params);
    }

    /**
     * 获取智能纪要详情
     * @param recordFileId 录制文件ID
     * @param userId 用户ID
     * @param minuteType 纪要类型：1-按章节，2-按主题，3-按发言人，默认1
     * @param textType 文本类型：1-纯文本，2-markdown，默认1
     * @param lang 翻译类型：default-原文，zh-简体中文，en-英文，ja-日语，默认default
     * @param pwd 录制文件访问密码，可选
     * @returns 智能纪要详情信息
     */
    async getSmartMinutesDetail(
        recordFileId: string,
        userId: string,
        minuteType: number = 1,
        textType: number = 1,
        lang: string = 'default',
        pwd?: string
    ): Promise<SmartMinutesResponse> {
        const params: Record<string, any> = {
            operator_id: userId,
            operator_id_type: 1,
            minute_type: minuteType,
            text_type: textType,
            lang
        };

        if (pwd !== undefined) {
            params.pwd = pwd;
        }

        return this.sendRequest<SmartMinutesResponse>('GET', `/v1/smart/minutes/${recordFileId}`, params);
    }


    /**
     * 获取智能总结详情
     * @param recordFileId 录制文件ID
     * @param userId 用户ID
     * @param lang 翻译类型：default-原文，zh-简体中文，en-英文，ja-日语，默认default
     * @param pwd 录制文件访问密码，可选
     * @returns 智能总结详情信息
     */
    async getSmartSummaryDetail(
        recordFileId: string,
        userId: string,
        lang: string = 'default',
        pwd?: string
    ): Promise<SmartSummaryResponse> {
        const params: Record<string, any> = {
            record_file_id: recordFileId,
            operator_id: userId,
            operator_id_type: 1,
            lang
        };

        if (pwd !== undefined) {
            params.pwd = pwd;
        }

        return this.sendRequest<SmartSummaryResponse>('GET', '/v1/smart/fullsummary', params);
    }

    /**
     * 获取智能话题详情
     * @param recordFileId 录制文件ID
     * @param userId 用户ID
     * @param lang 翻译类型：default-原文，zh-简体中文，en-英文，ja-日语，默认default
     * @param pwd 录制文件访问密码，可选
     * @returns 智能话题详情信息
     */
    async getSmartTopicsDetail(
        recordFileId: string,
        userId: string,
        lang: string = 'default',
        pwd?: string
    ): Promise<SmartTopicsResponse> {
        const params: Record<string, any> = {
            record_file_id: recordFileId,
            operator_id: userId,
            operator_id_type: 1,
            lang
        };

        if (pwd !== undefined) {
            params.pwd = pwd;
        }

        return this.sendRequest<SmartTopicsResponse>('GET', '/v1/smart/topics', params);
    }
}