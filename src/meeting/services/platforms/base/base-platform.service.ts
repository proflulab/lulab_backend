import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeetingPlatform } from '@prisma/client';
import { IPlatformService } from './platform.interface';

/**
 * 平台服务基类
 */
@Injectable()
export abstract class BasePlatformService implements IPlatformService {
    protected readonly logger = new Logger(this.constructor.name);

    constructor(protected readonly configService: ConfigService) {}

    /**
     * 平台类型
     */
    abstract readonly platform: MeetingPlatform;

    /**
     * 获取平台配置
     */
    protected abstract getConfig(): any;

    /**
     * 获取录制文件详情
     */
    abstract getRecordingFileDetail(fileId: string, userId: string): Promise<any>;

    /**
     * 获取会议录制列表
     */
    abstract getRecordingList(params: any): Promise<any>;

    /**
     * 获取会议详情
     */
    abstract getMeetingDetail(meetingId: string, userId: string): Promise<any>;

    /**
     * 获取会议参与者列表
     */
    abstract getMeetingParticipants(meetingId: string, userId: string): Promise<any>;

    /**
     * 从URL获取文本内容
     */
    async fetchTextFromUrl(url: string): Promise<string> {
        if (!url) {
            return '';
        }

        try {
            const headers: Record<string, string> = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };

            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            this.logger.error('获取文件内容失败:', error);
            return '';
        }
    }

    /**
     * 处理API错误
     */
    protected handleApiError(error: any, context: string): void {
        this.logger.error(`${context}失败:`, error);
        throw error;
    }

    /**
     * 验证必要参数
     */
    protected validateRequiredParams(params: Record<string, any>, requiredFields: string[]): void {
        for (const field of requiredFields) {
            if (!params[field]) {
                throw new Error(`Missing required parameter: ${field}`);
            }
        }
    }
}