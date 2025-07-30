/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-29 18:40:57
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-30 15:40:27
 * @FilePath: /lulab_backend/src/meeting/services/platforms/tencent/handlers/meeting-started-handler.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { Injectable, Logger } from '@nestjs/common';
import { BaseTencentEventHandler } from './base-event-handler';
import { TencentMeetingEvent } from '../../../../types/tencent.types';

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
    protected async handlePayload(payload: any, index: number): Promise<void> {
        try {
            const meetingInfo = payload.meeting_info;

            if (!meetingInfo) {
                throw new Error('Missing meeting_info in meeting.started event');
            }

            this.logger.log(`会议开始 [${index}]: ${meetingInfo.subject} (${meetingInfo.meeting_id})`, {
                meetingId: meetingInfo.meeting_id,
                meetingCode: meetingInfo.meeting_code,
                subject: meetingInfo.subject,
                creator: meetingInfo.creator?.user_name,
                startTime: meetingInfo.start_time
            });

            // 这里可以添加具体的会议开始处理逻辑
            // 例如：记录会议开始时间、发送通知、更新会议状态等

        } catch (error) {
            this.logger.error('处理会议开始载荷失败', error);
            throw error;
        }
    }
}