/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-29 18:40:57
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-08-11 00:18:39
 * @FilePath: /lulab_backend/src/meeting/services/platforms/tencent/handlers/meeting-started-handler.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { Injectable, Logger } from '@nestjs/common';
import { BaseTencentEventHandler } from './base-event-handler';
import { TencentMeetingEvent, TencentEventPayload } from '../../types/tencent.types';

/**
 * 腾讯会议开始事件处理器
 */
@Injectable()
export class MeetingStartedHandler extends BaseTencentEventHandler {
    protected readonly logger = new Logger(MeetingStartedHandler.name);

    /**
     * 获取支持的事件类型
     */
    getSupportedEventType(): string {
        return 'meeting.started';
    }

    /**
     * 处理会议开始事件
     * @param eventData 事件数据
     */
    async handleEvent(eventData: TencentMeetingEvent): Promise<void> {
        this.logger.log(`开始处理会议开始事件: ${eventData.event}`);

        for (let i = 0; i < eventData.payload.length; i++) {
            await this.handlePayload(eventData.payload[i], i);
        }

        this.logger.log('会议开始事件处理完成');
    }

    /**
     * 处理单个载荷的具体实现
     * @param payload 载荷数据
     * @param index 载荷索引
     */
    protected async handlePayload(payload: TencentEventPayload, index: number): Promise<void> {
        try {
            const { meeting_info, operator, operate_time } = payload;

            // 验证必要字段
            if (!meeting_info) {
                throw new Error('Missing meeting_info in meeting.started event');
            }

            if (!operator) {
                throw new Error('Missing operator in meeting.started event');
            }

            // 转换时间戳
            const operateDateTime = new Date(operate_time);
            const startDateTime = new Date(meeting_info.start_time * 1000);
            const endDateTime = new Date(meeting_info.end_time * 1000);

            // 获取会议创建模式描述
            const createModeDesc = this.getMeetingCreateModeDesc(meeting_info.meeting_create_mode);
            const createFromDesc = this.getMeetingCreateFromDesc(meeting_info.meeting_create_from);
            const meetingTypeDesc = this.getMeetingTypeDesc(meeting_info.meeting_type);


            this.logger.log(`会议开始 [${index}]: ${meeting_info.subject} (${meeting_info.meeting_id})`, {
                meetingId: meeting_info.meeting_id,
                meetingCode: meeting_info.meeting_code,
                subject: meeting_info.subject,
                creator: meeting_info.creator?.user_name,
                startTime: meeting_info.start_time
            });

            // 这里可以添加具体的会议开始处理逻辑
            await this.processMeetingStarted(payload, index);

        } catch (error) {
            this.logger.error('处理会议开始载荷失败', error);
            throw error;
        }
    }

    /**
 * 处理会议开始的具体业务逻辑
 * @param payload 载荷数据
 * @param index 载荷索引
 */
    private async processMeetingStarted(payload: TencentEventPayload, index: number): Promise<void> {
        const { meeting_info, operator } = payload;

        try {
            // TODO: 在这里添加具体的业务处理逻辑
            // 例如：
            // 1. 更新数据库中的会议状态
            // 2. 发送会议开始通知
            // 3. 记录会议开始时间
            // 4. 触发相关的业务流程

            this.logger.debug(`会议 ${meeting_info.meeting_id} 开始处理业务逻辑`);

            // 示例：记录会议开始事件到数据库
            // await this.meetingService.updateMeetingStatus(meeting_info.meeting_id, 'started');

            // 示例：发送通知
            // await this.notificationService.sendMeetingStartedNotification(meeting_info, operator);

        } catch (error) {
            this.logger.error(`处理会议开始业务逻辑失败: ${meeting_info.meeting_id}`, error);
            // 根据业务需求决定是否重新抛出错误
            // throw error;
        }
    }


    /**
     * 获取会议创建模式描述
     */
    private getMeetingCreateModeDesc(mode?: number): string {
        switch (mode) {
            case 0:
                return '普通会议';
            case 1:
                return '快速会议';
            default:
                return '未知模式';
        }
    }

    /**
     * 获取会议创建来源描述
     */
    private getMeetingCreateFromDesc(from?: number): string {
        switch (from) {
            case 0:
                return '空来源';
            case 1:
                return '客户端';
            case 2:
                return 'web';
            case 3:
                return '企微';
            case 4:
                return '微信';
            case 5:
                return 'outlook';
            case 6:
                return 'restapi';
            case 7:
                return '腾讯文档';
            case 8:
                return 'Rooms 智能录制';
            default:
                return '未知来源';
        }
    }

    /**
    * 获取会议类型描述
    */
    private getMeetingTypeDesc(type: number): string {
        switch (type) {
            case 0:
                return '一次性会议';
            case 1:
                return '周期性会议';
            case 2:
                return '微信专属会议';
            case 4:
                return 'rooms 投屏会议';
            case 5:
                return '个人会议号会议';
            default:
                return '未知类型';
        }
    }
}