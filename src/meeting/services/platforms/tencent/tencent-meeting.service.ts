import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TencentApiService } from './tencent-api.service';
import {
    RecordingDetail,
    RecordMeetingsResponse,
    MeetingParticipantsResponse,
    MeetingDetailResponse
} from '../../../types/tencent.types';
import {
    PlatformApiException,
    PlatformConfigException
} from '../../../exceptions/meeting.exceptions';

/**
 * 腾讯会议平台服务
 * 封装腾讯会议API调用和业务逻辑
 */
@Injectable()
export class TencentMeetingService {
    private readonly logger = new Logger(TencentMeetingService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly tencentApiService: TencentApiService
    ) {
        this.validateConfig();
    }

    /**
     * 验证配置
     */
    private validateConfig(): void {
        const requiredConfigs = [
            'TENCENT_MEETING_SECRET_ID',
            'TENCENT_MEETING_SECRET_KEY',
            'TENCENT_MEETING_APP_ID',
            'TENCENT_MEETING_SDK_ID',
            'TENCENT_MEETING_TOKEN',
            'TENCENT_MEETING_ENCODING_AES_KEY'
        ];

        const missingConfigs = requiredConfigs.filter(
            config => !this.configService.get<string>(config)
        );

        if (missingConfigs.length > 0) {
            throw new PlatformConfigException(
                'TENCENT_MEETING',
                missingConfigs.join(', ')
            );
        }
    }

    /**
     * 获取录制文件详情
     * @param fileId 录制文件ID
     * @param userId 用户ID
     * @returns 录制详情信息
     */
    async getRecordingFileDetail(fileId: string, userId: string): Promise<RecordingDetail> {
        try {
            this.logger.log(`获取录制文件详情: ${fileId}`);
            const result = await this.tencentApiService.getRecordingFileDetail(fileId, userId);
            this.logger.log(`成功获取录制文件详情: ${fileId}`);
            return result;
        } catch (error) {
            this.logger.error(`获取录制文件详情失败: ${fileId}`, error);
            throw new PlatformApiException(
                'TENCENT_MEETING',
                'getRecordingFileDetail',
                error.message
            );
        }
    }

    /**
     * 获取账户级会议录制列表
     * @param startTime 查询起始时间戳（单位秒）
     * @param endTime 查询结束时间戳（单位秒）
     * @param pageSize 分页大小，默认10，最大20
     * @param page 页码，从1开始，默认1
     * @param operatorId 操作者ID
     * @param operatorIdType 操作者ID类型
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
            this.logger.log(`获取会议录制列表: ${startTime} - ${endTime}`);
            const result = await this.tencentApiService.getCorpRecords(
                startTime,
                endTime,
                pageSize,
                page,
                operatorId,
                operatorIdType
            );
            this.logger.log(`成功获取会议录制列表，共 ${result.total_count} 条记录`);
            return result;
        } catch (error) {
            this.logger.error(`获取会议录制列表失败`, error);
            throw new PlatformApiException(
                'TENCENT_MEETING',
                'getCorpRecords',
                error.message
            );
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
            this.logger.log(`获取会议详情: ${meetingId}`);
            const result = await this.tencentApiService.getMeetingDetail(meetingId, userId, instanceId);
            this.logger.log(`成功获取会议详情: ${meetingId}`);
            return result;
        } catch (error) {
            this.logger.error(`获取会议详情失败: ${meetingId}`, error);
            throw new PlatformApiException(
                'TENCENT_MEETING',
                'getMeetingDetail',
                error.message
            );
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
            this.logger.log(`获取会议参会成员列表: ${meetingId}`);
            const result = await this.tencentApiService.getMeetingParticipants(meetingId, userId, subMeetingId);
            this.logger.log(`成功获取会议参会成员列表: ${meetingId}，共 ${result.total_count} 人`);
            return result;
        } catch (error) {
            this.logger.error(`获取会议参会成员列表失败: ${meetingId}`, error);
            throw new PlatformApiException(
                'TENCENT_MEETING',
                'getMeetingParticipants',
                error.message
            );
        }
    }

    /**
     * 从URL获取文本内容
     * @param url 文件URL
     * @returns 文本内容
     */
    async fetchTextFromUrl(url: string): Promise<string> {
        try {
            this.logger.log(`从URL获取文本内容: ${url}`);
            const result = await this.tencentApiService.fetchTextFromUrl(url);
            this.logger.log(`成功从URL获取文本内容，长度: ${result.length}`);
            return result;
        } catch (error) {
            this.logger.error(`从URL获取文本内容失败: ${url}`, error);
            throw new PlatformApiException(
                'TENCENT_MEETING',
                'fetchTextFromUrl',
                error.message
            );
        }
    }

    /**
     * 测试API连接
     * @returns 连接状态
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            // 使用一个简单的API调用来测试连接
            const endTime = Math.floor(Date.now() / 1000);
            const startTime = endTime - 24 * 60 * 60; // 24小时前

            await this.getCorpRecords(startTime, endTime, 1, 1);

            return {
                success: true,
                message: 'Tencent Meeting API connection successful'
            };
        } catch (error) {
            this.logger.error('腾讯会议API连接测试失败', error);
            return {
                success: false,
                message: `Tencent Meeting API connection failed: ${error.message}`
            };
        }
    }

    /**
     * 获取配置状态
     * @returns 配置状态信息
     */
    getConfigStatus(): {
        configured: boolean;
        missingConfigs: string[];
        availableConfigs: string[];
    } {
        const requiredConfigs = [
            'TENCENT_MEETING_SECRET_ID',
            'TENCENT_MEETING_SECRET_KEY',
            'TENCENT_MEETING_APP_ID',
            'TENCENT_MEETING_SDK_ID',
            'TENCENT_MEETING_TOKEN',
            'TENCENT_MEETING_ENCODING_AES_KEY'
        ];

        const availableConfigs = requiredConfigs.filter(
            config => !!this.configService.get<string>(config)
        );

        const missingConfigs = requiredConfigs.filter(
            config => !this.configService.get<string>(config)
        );

        return {
            configured: missingConfigs.length === 0,
            missingConfigs,
            availableConfigs
        };
    }
}