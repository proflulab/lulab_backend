import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { BaseTencentEventHandler } from './base-event-handler';
import { TencentMeetingEvent } from '../../../../types/tencent.types';
import { MeetingService } from '../../../meeting.service';
import { MeetingPlatform } from '@prisma/client';

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

        // 处理所有录制文件
        for (const [fileIndex, recordingFile] of payload.recording_files.entries()) {
            await this.processRecordingFile(
                recordingFile,
                meetingInfo,
                fileIndex
            );
        }
    }

    /**
     * 处理单个录制文件
     * @param recordingFile 录制文件信息
     * @param meetingInfo 会议信息
     * @param fileIndex 文件索引
     */
    private async processRecordingFile(
        recordingFile: any,
        meetingInfo: any,
        fileIndex: number
    ): Promise<void> {
        const { record_file_id } = recordingFile;
        this.logger.log(`处理录制文件 ${fileIndex + 1}: ${record_file_id}`);

        try {
            await this.meetingService.processRecordingFile({
                recordFileId: record_file_id,
                meetingId: meetingInfo.meeting_id.toString(),
                meetingCode: meetingInfo.meeting_code,
                meetingType: meetingInfo.meeting_type,
                subMeetingId: meetingInfo.sub_meeting_id,
                hostUserId: meetingInfo.creator.userid,
                hostUserName: meetingInfo.creator.user_name,
                startTime: meetingInfo.start_time,
                endTime: meetingInfo.end_time,
                title: meetingInfo.subject,
                platform: MeetingPlatform.TENCENT_MEETING
            });

            this.logger.log(`录制文件处理成功: ${record_file_id}`);
        } catch (error) {
            this.logger.error(`录制文件处理失败: ${record_file_id}`, error);
            // 继续处理其他文件，不中断整个流程
            throw error;
        }
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