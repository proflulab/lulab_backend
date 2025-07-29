import { Injectable, Logger } from '@nestjs/common';
import { BaseTencentEventHandler } from './base-event-handler';
import { TencentMeetingEvent } from '../../../../types/tencent.types';

/**
 * 腾讯会议结束事件处理器
 */
@Injectable()
export class MeetingEndedHandler extends BaseTencentEventHandler {
    protected readonly logger = new Logger(MeetingEndedHandler.name);

    /**
     * 获取支持的事件类型
     */
    getSupportedEventType(): string {
        return 'meeting.ended';
    }

    /**
     * 处理会议结束事件
     * @param eventData 事件数据
     */
    async handleEvent(eventData: TencentMeetingEvent): Promise<void> {
        this.logger.log(`开始处理会议结束事件: ${eventData.event}`);

        for (let i = 0; i < eventData.payload.length; i++) {
            await this.processPayload(eventData.payload[i], i);
        }

        this.logger.log('会议结束事件处理完成');
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
            
            if (!meetingInfo) {
                throw new Error('Missing meeting_info in meeting.ended event');
            }

            this.logger.log(`会议结束 [${index}]: ${meetingInfo.subject} (${meetingInfo.meeting_id})`, {
                meetingId: meetingInfo.meeting_id,
                meetingCode: meetingInfo.meeting_code,
                subject: meetingInfo.subject,
                creator: meetingInfo.creator?.user_name,
                startTime: meetingInfo.start_time,
                endTime: meetingInfo.end_time
            });

            // 这里可以添加具体的会议结束处理逻辑
            // 例如：记录会议结束时间、计算会议时长、发送通知、更新会议状态等
            
        } catch (error) {
            this.logger.error('处理会议结束载荷失败', error);
            throw error;
        }
    }
}