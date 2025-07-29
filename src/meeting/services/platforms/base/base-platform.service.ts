/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-28 14:01:40
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-29 18:30:00
 * @FilePath: /lulab_backend/src/meeting/services/platforms/base/base-platform.service.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

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

    constructor(protected readonly configService: ConfigService) { }

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