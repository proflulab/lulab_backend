import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifySignature, aesDecrypt } from './tencent-crypto.service';
import { TencentMeetingEvent } from '../../../types/tencent.types';
import {
    WebhookSignatureVerificationException,
    WebhookDecryptionException,
    WebhookUrlVerificationException
} from '../../../exceptions/webhook.exceptions';
import { MeetingService } from '../../meeting.service';

/**
 * 腾讯会议Webhook处理器
 * 负责处理腾讯会议的Webhook验证和事件解析
 */
@Injectable()
export class TencentWebhookHandler {
    private readonly logger = new Logger(TencentWebhookHandler.name);

    constructor(
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => MeetingService))
        private readonly meetingService: MeetingService
    ) { }

    /**
     * 验证Webhook URL
     * @param params 验证参数
     * @returns 解密后的明文
     */
    async verifyUrl(params: {
        checkStr: string;
        timestamp: string;
        nonce: string;
        signature: string;
    }): Promise<string> {
        const { checkStr, timestamp, nonce, signature } = params;

        try {
            // 1. 参数校验
            if (!checkStr || !timestamp || !nonce || !signature) {
                throw new WebhookUrlVerificationException(
                    'TENCENT_MEETING',
                    'Missing required parameters for URL verification'
                );
            }

            const token = this.configService.get<string>('TENCENT_MEETING_TOKEN');
            const encodingAesKey = this.configService.get<string>('TENCENT_MEETING_ENCODING_AES_KEY');

            if (!token || !encodingAesKey) {
                throw new WebhookUrlVerificationException(
                    'TENCENT_MEETING',
                    'Missing Tencent Meeting configuration'
                );
            }

            // 2. 签名验证
            const isValid = verifySignature(
                token,
                timestamp,
                nonce,
                decodeURIComponent(checkStr),
                signature
            );

            if (!isValid) {
                throw new WebhookSignatureVerificationException(
                    'TENCENT_MEETING'
                );
            }

            // 3. 解密check_str
            this.logger.log('开始解密check_str');
            const decryptedStr = await aesDecrypt(decodeURIComponent(checkStr), encodingAesKey);
            this.logger.log('URL验证解密成功');

            return decryptedStr;
        } catch (error) {
            this.logger.error('腾讯会议Webhook URL验证失败:', error);
            if (error instanceof WebhookSignatureVerificationException ||
                error instanceof WebhookUrlVerificationException) {
                throw error;
            }
            throw new WebhookUrlVerificationException(
                'TENCENT_MEETING',
                `URL verification failed: ${error.message}`
            );
        }
    }

    /**
     * 验证Webhook事件签名
     * @param timestamp 时间戳
     * @param nonce 随机数
     * @param signature 签名
     * @param data 数据
     * @returns 验证结果
     */
    async verifySignature(
        timestamp: string,
        nonce: string,
        signature: string,
        data: string
    ): Promise<boolean> {
        try {
            const token = this.configService.get<string>('TENCENT_MEETING_TOKEN');

            if (!token) {
                throw new WebhookSignatureVerificationException(
                    'TENCENT_MEETING'
                );
            }

            return verifySignature(token, timestamp, nonce, data, signature);
        } catch (error) {
            this.logger.error('腾讯会议Webhook签名验证失败:', error);
            throw new WebhookSignatureVerificationException(
                'TENCENT_MEETING'
            );
        }
    }

    /**
     * 解密Webhook数据
     * @param encryptedData 加密数据
     * @returns 解密后的数据
     */
    async decryptData(encryptedData: string): Promise<TencentMeetingEvent> {
        try {
            const encodingAesKey = this.configService.get<string>('TENCENT_MEETING_ENCODING_AES_KEY');

            if (!encodingAesKey) {
                throw new WebhookDecryptionException(
                    'TENCENT_MEETING',
                    'Missing Tencent Meeting encoding AES key configuration'
                );
            }

            // 解密数据
            const decryptedData = await aesDecrypt(encryptedData, encodingAesKey);

            // 解析JSON
            const eventData: TencentMeetingEvent = JSON.parse(decryptedData);

            this.logger.log(`成功解密腾讯会议事件: ${eventData.event}`);
            return eventData;
        } catch (error) {
            this.logger.error('腾讯会议Webhook数据解密失败:', error);
            if (error instanceof SyntaxError) {
                throw new WebhookDecryptionException(
                    'TENCENT_MEETING',
                    'Failed to parse decrypted data as JSON'
                );
            }
            throw new WebhookDecryptionException(
                'TENCENT_MEETING',
                `Data decryption failed: ${error.message}`
            );
        }
    }

    /**
     * 处理Webhook事件
     * @param eventData 事件数据
     */
    async handleEvent(eventData: TencentMeetingEvent): Promise<void> {
        this.logger.log(`处理腾讯会议事件: ${eventData.event}`);

        try {
            // 验证事件数据格式
            this.validateEventData(eventData);

            // 记录事件接收
            this.logEventReceived(eventData);

            // 根据事件类型进行具体处理
            switch (eventData.event) {
                case 'recording.completed':
                    await this.handleRecordingCompleted(eventData);
                    break;
                default:
                    this.logger.warn(`未处理的事件类型: ${eventData.event}`);
                    break;
            }

            this.logger.log(`腾讯会议事件处理完成: ${eventData.event}`);
        } catch (error) {
            this.logger.error(`腾讯会议事件处理失败: ${eventData.event}`, error);
            throw error;
        }
    }

    /**
     * 验证事件数据格式
     * @param eventData 事件数据
     */
    private validateEventData(eventData: TencentMeetingEvent): void {
        if (!eventData.event) {
            throw new Error('Missing event type in webhook data');
        }

        if (!eventData.payload || !Array.isArray(eventData.payload)) {
            throw new Error('Invalid payload format in webhook data');
        }

        // 根据事件类型进行特定验证
        switch (eventData.event) {
            case 'recording.completed':
                this.validateRecordingCompletedEvent(eventData);
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
        for (const payload of eventData.payload) {
            if (!payload.meeting_info) {
                throw new Error('Missing meeting_info in recording.completed event');
            }

            if (!payload.recording_files || !Array.isArray(payload.recording_files)) {
                throw new Error('Missing or invalid recording_files in recording.completed event');
            }

            const meetingInfo = payload.meeting_info;
            const requiredFields = ['meeting_id', 'meeting_code', 'subject', 'creator'];

            for (const field of requiredFields) {
                if (!meetingInfo[field]) {
                    throw new Error(`Missing required field '${field}' in meeting_info`);
                }
            }

            if (!meetingInfo.creator.userid || !meetingInfo.creator.user_name) {
                throw new Error('Missing required creator information in meeting_info');
            }
        }
    }

    /**
     * 记录事件接收日志
     * @param eventData 事件数据
     */
    private logEventReceived(eventData: TencentMeetingEvent): void {
        const eventSummary = {
            event: eventData.event,
            payloadCount: eventData.payload.length,
            timestamp: new Date().toISOString()
        };

        // 如果是录制完成事件，记录更多详细信息
        if (eventData.event === 'recording.completed') {
            const meetings = eventData.payload.map(p => ({
                meetingId: p.meeting_info.meeting_id,
                meetingCode: p.meeting_info.meeting_code,
                subject: p.meeting_info.subject,
                recordingFilesCount: p.recording_files.length
            }));

            this.logger.log('录制完成事件详情:', {
                ...eventSummary,
                meetings
            });
        } else {
            this.logger.log('事件接收详情:', eventSummary);
        }
    }

    /**
     * 获取支持的事件类型列表
     * @returns 支持的事件类型
     */
    getSupportedEvents(): string[] {
        return [
            'recording.completed'
            // 可以在这里添加其他支持的事件类型
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

    /**
     * 处理腾讯会议录制完成事件
     * @param eventData 事件数据
     */
    private async handleRecordingCompleted(eventData: TencentMeetingEvent): Promise<void> {
        this.logger.log('开始处理腾讯会议录制完成事件');

        for (const payload of eventData.payload) {
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

            // 处理所有录制文件
            for (const recordingFile of payload.recording_files) {
                const { record_file_id } = recordingFile;
                this.logger.log(`处理录制文件ID: ${record_file_id}`);

                try {
                    await this.meetingService.processRecordingFile({
                        recordFileId: record_file_id,
                        meetingId: meeting_id.toString(),
                        meetingCode: meeting_code,
                        meetingType: meeting_type,
                        subMeetingId: sub_meeting_id,
                        hostUserId: userid,
                        hostUserName: user_name,
                        startTime: start_time,
                        endTime: end_time,
                        title: subject
                    });
                } catch (error) {
                    this.logger.error(`处理录制文件失败: ${record_file_id}`, error);
                    // 继续处理其他文件，不中断整个流程
                }
            }
        }

        this.logger.log('腾讯会议录制完成事件处理完毕');
    }
}