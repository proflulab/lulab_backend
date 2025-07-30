/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-29 18:38:27
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-30 15:46:02
 * @FilePath: /lulab_backend/src/meeting/services/platforms/tencent/handlers/recording-completed-handler.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */


import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { BaseTencentEventHandler } from './base-event-handler';
import { TencentMeetingEvent } from '../../../../types/tencent.types';
import { MeetingService } from '../../../meeting.service';

/**
 * 录制完成事件处理器
 * 专门处理腾讯会议录制完成事件
 */
@Injectable()
export class RecordingCompletedHandler extends BaseTencentEventHandler {
    constructor(
        @Inject(forwardRef(() => MeetingService))
        private readonly meetingService: MeetingService
    ) {
        super();
    }

    /**
     * 获取支持的事件类型
     */
    getSupportedEventType(): string {
        return 'recording.completed';
    }

    /**
     * 处理录制完成事件
     * @param eventData 事件数据
     */
    async handleEvent(eventData: TencentMeetingEvent): Promise<void> {
        this.logEventStart(eventData);
        this.logEventReceived(eventData);

        try {
            // 处理所有载荷
            for (const [index, payload] of eventData.payload.entries()) {
                await this.handlePayload(payload, index);
            }

            this.logEventComplete(eventData);
        } catch (error) {
            this.logEventError(eventData, error);
            throw error;
        }
    }

    /**
     * 处理单个载荷的具体实现
     * @param payload 载荷数据
     * @param index 载荷索引
     */
    protected async handlePayload(payload: any, index: number): Promise<void> {
        const meetingInfo = payload.meeting_info;
        const {
            meeting_id,
            meeting_code,
            meeting_type,
            sub_meeting_id,
            creator: { userid, user_name },
            start_time,
            end_time,
            subject
        } = meetingInfo;

        // 记录会议详情
        this.logMeetingDetails(meetingInfo, payload.recording_files.length);

        // 录制文件处理功能已被移除
        this.logger.log(`会议 ${meetingInfo.meeting_id} 的录制完成事件已接收，但录制文件处理功能已被移除`);
    }



    /**
     * 记录会议详情
     * @param meetingInfo 会议信息
     * @param recordingFilesCount 录制文件数量
     */
    private logMeetingDetails(meetingInfo: any, recordingFilesCount: number): void {
        const meetingDetails = {
            meetingId: meetingInfo.meeting_id,
            meetingCode: meetingInfo.meeting_code,
            subject: meetingInfo.subject,
            creator: meetingInfo.creator.user_name,
            recordingFilesCount
        };

        this.logger.log('录制完成事件会议详情:', meetingDetails);
    }
}