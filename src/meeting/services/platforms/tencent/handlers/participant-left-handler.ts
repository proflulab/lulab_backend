import { Injectable, Logger } from '@nestjs/common';
import { BaseTencentEventHandler } from './base-event-handler';
import { TencentMeetingEvent } from '../../../../types/tencent.types';

/**
 * 腾讯会议参与者离开事件处理器
 */
@Injectable()
export class ParticipantLeftHandler extends BaseTencentEventHandler {
    protected readonly logger = new Logger(ParticipantLeftHandler.name);

    /**
     * 获取支持的事件类型
     */
    getSupportedEventType(): string {
        return 'participant.left';
    }

    /**
     * 处理参与者离开事件
     * @param eventData 事件数据
     */
    async handleEvent(eventData: TencentMeetingEvent): Promise<void> {
        this.logger.log(`开始处理参与者离开事件: ${eventData.event}`);

        for (let i = 0; i < eventData.payload.length; i++) {
            await this.processPayload(eventData.payload[i], i);
        }

        this.logger.log('参与者离开事件处理完成');
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
                throw new Error('Missing meeting_info in participant.left event');
            }

            if (!participantInfo) {
                throw new Error('Missing participant_info in participant.left event');
            }

            this.logger.log(`参与者离开 [${index}]: ${participantInfo.user_name} 离开会议 ${meetingInfo.subject} (${meetingInfo.meeting_id})`, {
                meetingId: meetingInfo.meeting_id,
                meetingCode: meetingInfo.meeting_code,
                subject: meetingInfo.subject,
                participantId: participantInfo.userid,
                participantName: participantInfo.user_name,
                leftTime: participantInfo.left_time
            });

            // 这里可以添加具体的参与者离开处理逻辑
            // 例如：记录参与者离开时间、计算参与时长、发送通知、更新参与者列表等

        } catch (error) {
            this.logger.error('处理参与者离开载荷失败', error);
            throw error;
        }
    }
}