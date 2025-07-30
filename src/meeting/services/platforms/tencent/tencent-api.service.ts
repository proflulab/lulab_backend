import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSignature } from './tencent-crypto.service';
import {
    RecordingDetail,
    RecordMeetingsResponse,
    MeetingParticipantsResponse,
    MeetingDetailResponse
} from '../../../types/tencent.types';

@Injectable()
export class TencentApiService {
    constructor(private configService: ConfigService) { }

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
     * 获取录制文件详情
     * @param fileId 录制文件ID
     * @param userId 用户ID
     * @returns 录制详情信息
     */
    async getRecordingFileDetail(fileId: string, userId: string): Promise<RecordingDetail> {
        try {
            const requestUri = `/v1/addresses/${fileId}?userid=${userId}`;
            const apiUrl = `https://api.meeting.qq.com${requestUri}`;

            // 1. 准备请求头参数
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const nonce = Math.floor(Math.random() * 100000).toString();
            const config = this.getConfig();

            // 2. 生成签名
            const signature = generateSignature(
                config.secretKey,
                'GET',
                config.secretId,
                nonce,
                timestamp,
                requestUri,
                ''
            );

            // 3. 发送请求
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
                method: 'GET',
                headers
            });

            const responseData = await response.json();

            // 4. 检查错误信息
            if (responseData.error_info) {
                const errorInfo = responseData.error_info;
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

            return responseData as RecordingDetail;
        } catch (error) {
            console.error('获取录制文件详情失败:', error);
            throw error;
        }
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
        try {
            // 验证时间区间不超过31天
            if (endTime - startTime > 31 * 24 * 60 * 60) {
                throw new Error('时间区间不允许超过31天');
            }

            // 验证分页参数
            if (pageSize > 20) {
                pageSize = 20; // 限制最大分页大小为20
            }

            const config = this.getConfig();
            const finalOperatorId = operatorId || config.userId;

            const requestUri = `/v1/corp/records?start_time=${startTime}&end_time=${endTime}&page_size=${pageSize}&page=${page}&operator_id=${finalOperatorId}&operator_id_type=${operatorIdType}`;
            const apiUrl = `https://api.meeting.qq.com${requestUri}`;

            // 1. 准备请求头参数
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const nonce = Math.floor(Math.random() * 100000).toString();

            // 2. 生成签名
            const signature = generateSignature(
                config.secretKey,
                'GET',
                config.secretId,
                nonce,
                timestamp,
                requestUri,
                ''
            );

            // 3. 发送请求
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
                method: 'GET',
                headers
            });

            const responseData = await response.json();

            // 4. 检查错误信息
            if (responseData.error_info) {
                const errorInfo = responseData.error_info;
                console.error('获取会议录制列表失败:', {
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

                throw new Error(`API请求失败: ${errorInfo.message} (错误码: ${errorInfo.error_code})`);
            }

            return responseData as RecordMeetingsResponse;
        } catch (error) {
            console.error('获取会议录制列表失败:', error);
            throw error;
        }
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
        try {
            const requestUri = `/v1/meetings/${meetingId}?userid=${userId}&instanceid=${instanceId}`;
            const apiUrl = `https://api.meeting.qq.com${requestUri}`;

            // 1. 准备请求头参数
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const nonce = Math.floor(Math.random() * 100000).toString();
            const config = this.getConfig();

            // 2. 生成签名
            const signature = generateSignature(
                config.secretKey,
                'GET',
                config.secretId,
                nonce,
                timestamp,
                requestUri,
                ''
            );

            // 3. 发送请求
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
                method: 'GET',
                headers
            });

            const responseData = await response.json();

            // 4. 检查错误信息
            if (responseData.error_info) {
                const errorInfo = responseData.error_info;
                console.error('获取会议详情失败:', {
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

                throw new Error(`API请求失败: ${errorInfo.message} (错误码: ${errorInfo.error_code})`);
            }

            return responseData as MeetingDetailResponse;
        } catch (error) {
            console.error('获取会议详情失败:', error);
            throw error;
        }
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
        try {
            // 构建 requestUri
            const requestUri = `/v1/meetings/${meetingId}/participants?userid=${userId}`
                + (subMeetingId ? `&sub_meeting_id=${subMeetingId}` : '');
            const apiUrl = `https://api.meeting.qq.com${requestUri}`;

            // 1. 准备请求头参数
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const nonce = Math.floor(Math.random() * 100000).toString();
            const config = this.getConfig();

            // 2. 生成签名
            const signature = generateSignature(
                config.secretKey,
                'GET',
                config.secretId,
                nonce,
                timestamp,
                requestUri,
                ''
            );

            // 3. 发送请求
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
                method: 'GET',
                headers
            });

            const responseData = await response.json();

            // 4. 检查错误信息
            if (responseData.error_info) {
                const errorInfo = responseData.error_info;
                console.error('获取会议参会成员列表失败:', {
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

                throw new Error(`API请求失败: ${errorInfo.message} (错误码: ${errorInfo.error_code})`);
            }

            return responseData as MeetingParticipantsResponse;
        } catch (error) {
            console.error('获取会议参会成员列表失败:', error);
            throw error;
        }
    }
}