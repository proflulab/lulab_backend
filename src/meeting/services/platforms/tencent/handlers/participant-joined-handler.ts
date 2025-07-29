/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-29 18:43:46
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-29 18:44:25
 * @FilePath: /lulab_backend/src/meeting/services/platforms/tencent/handlers/participant-joined-handler.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { Injectable, Logger } from '@nestjs/common';
import { BaseTencentEventHandler } from './base-event-handler';
import { TencentMeetingEvent } from '../../../../types/tencent.types';

/**
 * 腾讯会议参与者加入事件处理器
 */
@Injectable()
export class ParticipantJoinedHandler extends BaseTencentEventHandler {
    protected readonly logger = new Logger(ParticipantJoinedHandler.name);

    /**
     * 获取支持的事件类型
     */
    getSupportedEventType(): string {
        return 'participant.joined';
    }

    /**
     * 处理参与者加入事件
     * @param eventData 事件数据
     */
    async handleEvent(eventData: TencentMeetingEvent): Promise<void> {
        this.logger.log(`开始处理参与者加入事件: ${eventData.event}`);

        for (let i = 0; i < eventData.payload.length; i++) {
            await this.processPayload(eventData.payload[i], i);
        }

        this.logger.log('参与者加入事件处理完成');
    }

    /**
     * 处理单个载荷
     * @param payload 载荷数据
     * @param index 载荷索引
     */
    async handlePayload(payload: any, index: number): Promise<void> {
        await this.processPayload(payload, index);
    }

    /**
     * 处理单个载荷的具体实现
     * @param payload 载荷数据
     * @param index 载荷索引
     */
    protected async processPayload(payload: any, index: number): Promise<void> {
        try {
            const meetingInfo = payload.meeting_info;
            const participantInfo = payload.participant_info;

            if (!meetingInfo) {
                throw new Error('Missing meeting_info in participant.joined event');
            }

            if (!participantInfo) {
                throw new Error('Missing participant_info in participant.joined event');
            }

            this.logger.log(`参与者加入 [${index}]: ${participantInfo.user_name} 加入会议 ${meetingInfo.subject} (${meetingInfo.meeting_id})`, {
                meetingId: meetingInfo.meeting_id,
                meetingCode: meetingInfo.meeting_code,
                subject: meetingInfo.subject,
                participantId: participantInfo.userid,
                participantName: participantInfo.user_name,
                joinTime: participantInfo.join_time
            });

            // 这里可以添加具体的参与者加入处理逻辑
            // 例如：记录参与者信息、发送通知、更新参与者列表等

        } catch (error) {
            this.logger.error('处理参与者加入载荷失败', error);
            throw error;
        }
    }
}