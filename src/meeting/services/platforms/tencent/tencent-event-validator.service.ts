import { Injectable, Logger } from '@nestjs/common';
import { TencentMeetingEvent } from '../../../types/tencent.types';
import { WebhookDataFormatException } from '../../../exceptions/webhook.exceptions';

/**
 * 腾讯会议事件验证器
 * 负责验证各种类型的腾讯会议事件数据格式
 */
@Injectable()
export class TencentEventValidator {
    private readonly logger = new Logger(TencentEventValidator.name);
    private readonly PLATFORM_NAME = 'TENCENT_MEETING';

    /**
     * 验证事件数据格式
     * @param eventData 事件数据
     */
    validateEventData(eventData: TencentMeetingEvent): void {
        this.validateBasicEventStructure(eventData);
        this.validateEventTypeSpecific(eventData);
    }

    /**
     * 验证基本事件结构
     * @param eventData 事件数据
     */
    private validateBasicEventStructure(eventData: TencentMeetingEvent): void {
        if (!eventData.event) {
            throw new WebhookDataFormatException(
                this.PLATFORM_NAME,
                'event',
                'string'
            );
        }

        if (!eventData.payload || !Array.isArray(eventData.payload)) {
            throw new WebhookDataFormatException(
                this.PLATFORM_NAME,
                'payload',
                'array'
            );
        }

        if (eventData.payload.length === 0) {
            throw new WebhookDataFormatException(
                this.PLATFORM_NAME,
                'payload',
                'non-empty array'
            );
        }
    }

    /**
     * 根据事件类型进行特定验证
     * @param eventData 事件数据
     */
    private validateEventTypeSpecific(eventData: TencentMeetingEvent): void {
        switch (eventData.event) {
            case 'recording.completed':
                this.validateRecordingCompletedEvent(eventData);
                break;
            case 'meeting.started':
                this.validateMeetingStartedEvent(eventData);
                break;
            case 'meeting.ended':
                this.validateMeetingEndedEvent(eventData);
                break;
            case 'participant.joined':
                this.validateParticipantEvent(eventData);
                break;
            case 'participant.left':
                this.validateParticipantEvent(eventData);
                break;
            default:
                this.logger.warn(`未知的事件类型: ${eventData.event}`);
                break;
        }
    }

    /**
     * 验证录制完成事件数据
     * @param eventData 事件数据
     */
    private validateRecordingCompletedEvent(eventData: TencentMeetingEvent): void {
        for (const [index, payload] of eventData.payload.entries()) {
            const context = `payload[${index}]`;

            // 验证meeting_info
            if (!payload.meeting_info) {
                throw new WebhookDataFormatException(
                    this.PLATFORM_NAME,
                    `${context}.meeting_info`,
                    'object'
                );
            }

            // 验证recording_files
            if (!payload.recording_files || !Array.isArray(payload.recording_files)) {
                throw new WebhookDataFormatException(
                    this.PLATFORM_NAME,
                    `${context}.recording_files`,
                    'array'
                );
            }

            if (payload.recording_files.length === 0) {
                throw new WebhookDataFormatException(
                    this.PLATFORM_NAME,
                    `${context}.recording_files`,
                    'non-empty array'
                );
            }

            // 验证meeting_info必需字段
            this.validateMeetingInfo(payload.meeting_info, context);

            // 验证recording_files必需字段
            this.validateRecordingFiles(payload.recording_files, context);
        }
    }

    /**
     * 验证会议开始事件数据
     * @param eventData 事件数据
     */
    private validateMeetingStartedEvent(eventData: TencentMeetingEvent): void {
        for (const [index, payload] of eventData.payload.entries()) {
            const context = `payload[${index}]`;

            if (!payload.meeting_info) {
                throw new WebhookDataFormatException(
                    this.PLATFORM_NAME,
                    `${context}.meeting_info`,
                    'object'
                );
            }

            this.validateMeetingInfo(payload.meeting_info, context);
        }
    }

    /**
     * 验证会议结束事件数据
     * @param eventData 事件数据
     */
    private validateMeetingEndedEvent(eventData: TencentMeetingEvent): void {
        this.validateMeetingStartedEvent(eventData); // 结构相同
    }

    /**
     * 验证参与者事件数据
     * @param eventData 事件数据
     */
    private validateParticipantEvent(eventData: TencentMeetingEvent): void {
        for (const [index, payload] of eventData.payload.entries()) {
            const context = `payload[${index}]`;

            if (!payload.meeting_info) {
                throw new WebhookDataFormatException(
                    this.PLATFORM_NAME,
                    `${context}.meeting_info`,
                    'object'
                );
            }

            // 参与者事件可能有不同的payload结构，这里只验证meeting_info
            this.validateMeetingInfo(payload.meeting_info, context);

            // 如果payload中有participant_info字段，则验证它
            if ((payload as any).participant_info) {
                this.validateParticipantInfo((payload as any).participant_info, context);
            }
        }
    }

    /**
     * 验证会议信息
     * @param meetingInfo 会议信息
     * @param context 上下文
     */
    private validateMeetingInfo(meetingInfo: any, context: string): void {
        const requiredFields = [
            { field: 'meeting_id', type: 'number' },
            { field: 'meeting_code', type: 'string' },
            { field: 'subject', type: 'string' },
            { field: 'creator', type: 'object' }
        ];

        for (const { field, type } of requiredFields) {
            if (!meetingInfo[field]) {
                throw new WebhookDataFormatException(
                    this.PLATFORM_NAME,
                    `${context}.meeting_info.${field}`,
                    type
                );
            }
        }

        // 验证creator字段
        if (!meetingInfo.creator.userid || !meetingInfo.creator.user_name) {
            throw new WebhookDataFormatException(
                this.PLATFORM_NAME,
                `${context}.meeting_info.creator`,
                'object with userid and user_name'
            );
        }
    }

    /**
     * 验证录制文件信息
     * @param recordingFiles 录制文件列表
     * @param context 上下文
     */
    private validateRecordingFiles(recordingFiles: any[], context: string): void {
        for (const [index, file] of recordingFiles.entries()) {
            if (!file.record_file_id) {
                throw new WebhookDataFormatException(
                    this.PLATFORM_NAME,
                    `${context}.recording_files[${index}].record_file_id`,
                    'string'
                );
            }
        }
    }

    /**
     * 验证参与者信息
     * @param participantInfo 参与者信息
     * @param context 上下文
     */
    private validateParticipantInfo(participantInfo: any, context: string): void {
        const requiredFields = [
            { field: 'userid', type: 'string' },
            { field: 'user_name', type: 'string' }
        ];

        for (const { field, type } of requiredFields) {
            if (!participantInfo[field]) {
                throw new WebhookDataFormatException(
                    this.PLATFORM_NAME,
                    `${context}.participant_info.${field}`,
                    type
                );
            }
        }
    }

    /**
     * 获取支持的事件类型列表
     * @returns 支持的事件类型
     */
    getSupportedEvents(): string[] {
        return [
            'recording.completed',
            'meeting.started',
            'meeting.ended',
            'participant.joined',
            'participant.left'
        ];
    }

    /**
     * 检查事件是否支持
     * @param eventType 事件类型
     * @returns 是否支持
     */
    isEventSupported(eventType: string): boolean {
        return this.getSupportedEvents().includes(eventType);
    }
}