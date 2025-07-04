import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TencentMeetingApiService } from '../utils/tencent-meeting/meeting-api.service';
import {
    MeetingPlatform,
    MeetingType,
    FileType,
    StorageType,
    ProcessingStatus
} from '@prisma/client';
import { TencentMeetingEvent } from '../utils/tencent-meeting/types';
import { MeetingRepository } from './repositories/meeting.repository';

@Injectable()
export class MeetingService {
    private readonly logger = new Logger(MeetingService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly meetingRepository: MeetingRepository,
        private readonly tencentMeetingApi: TencentMeetingApiService
    ) {}

    /**
     * 处理腾讯会议录制完成事件
     * @param eventData 事件数据
     */
    async handleRecordingCompleted(eventData: TencentMeetingEvent): Promise<void> {
        this.logger.log('开始处理录制完成事件');

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
                    await this.processRecordingFile({
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

        this.logger.log('录制完成事件处理完毕');
    }

    /**
     * 处理单个录制文件
     */
    private async processRecordingFile(params: {
        recordFileId: string;
        meetingId: string;
        meetingCode: string;
        meetingType: number;
        subMeetingId?: string;
        hostUserId: string;
        hostUserName: string;
        startTime: number;
        endTime: number;
        title: string;
    }): Promise<void> {
        const {
            recordFileId,
            meetingId,
            meetingCode,
            meetingType,
            subMeetingId,
            hostUserId,
            hostUserName,
            startTime,
            endTime,
            title
        } = params;

        // 检查会议记录是否已存在
        const existingRecord = await this.meetingRepository.findMeetingByPlatformId(
            MeetingPlatform.TENCENT_MEETING,
            meetingId
        );

        let meetingRecord;
        if (existingRecord) {
            this.logger.log(`会议记录已存在: ${meetingId}`);
            meetingRecord = existingRecord;
        } else {
            // 创建新的会议记录
            meetingRecord = await this.meetingRepository.createMeetingRecord({
                platform: MeetingPlatform.TENCENT_MEETING,
                platformMeetingId: meetingId,
                platformRecordingId: recordFileId,
                title,
                meetingCode,
                type: this.mapMeetingType(meetingType),
                hostUserId,
                hostUserName,
                actualStartAt: new Date(startTime * 1000),
                endedAt: new Date(endTime * 1000),
                duration: Math.floor((endTime - startTime) / 60), // 转换为分钟
                hasRecording: true,
                recordingStatus: ProcessingStatus.PROCESSING,
                processingStatus: ProcessingStatus.PROCESSING,
                metadata: {
                    subMeetingId,
                    originalMeetingType: meetingType
                }
            });
            this.logger.log(`创建会议记录: ${meetingRecord.id}`);
        }

        // 获取录制文件详情
        const recordingDetail = await this.tencentMeetingApi.getRecordingFileDetail(recordFileId, hostUserId);

        // 处理各种类型的文件
        await this.processRecordingFiles(meetingRecord.id, recordingDetail);

        // 获取参会者信息
        await this.processParticipants(meetingRecord.id, meetingId, hostUserId, subMeetingId);

        // 更新会议记录状态
        await this.meetingRepository.updateMeetingRecord(meetingRecord.id, {
            recordingStatus: ProcessingStatus.COMPLETED,
            processingStatus: ProcessingStatus.COMPLETED
        });

        this.logger.log(`会议记录处理完成: ${meetingRecord.id}`);
    }

    /**
     * 处理录制文件
     */
    private async processRecordingFiles(meetingRecordId: string, recordingDetail: any): Promise<void> {
        const files: any[] = [];

        // 处理视频文件
        if (recordingDetail.download_address) {
            files.push({
                fileName: `recording_${recordingDetail.record_file_id}.${recordingDetail.download_address_file_type || 'mp4'}`,
                fileType: FileType.VIDEO,
                storageType: StorageType.URL,
                downloadUrl: recordingDetail.download_address,
                mimeType: `video/${recordingDetail.download_address_file_type || 'mp4'}`
            });
        }

        // 处理音频文件
        if (recordingDetail.audio_address) {
            files.push({
                fileName: `audio_${recordingDetail.record_file_id}.${recordingDetail.audio_address_file_type || 'mp3'}`,
                fileType: FileType.AUDIO,
                storageType: StorageType.URL,
                downloadUrl: recordingDetail.audio_address,
                mimeType: `audio/${recordingDetail.audio_address_file_type || 'mp3'}`
            });
        }

        // 处理会议纪要
        if (recordingDetail.meeting_summary) {
            for (const summary of recordingDetail.meeting_summary) {
                const content = await this.tencentMeetingApi.fetchTextFromUrl(summary.download_address);
                files.push({
                    fileName: `summary_${recordingDetail.record_file_id}.${summary.file_type}`,
                    fileType: FileType.SUMMARY,
                    storageType: StorageType.URL,
                    downloadUrl: summary.download_address,
                    content,
                    mimeType: `text/${summary.file_type}`
                });
            }
        }

        // 处理AI转录
        if (recordingDetail.ai_meeting_transcripts) {
            for (const transcript of recordingDetail.ai_meeting_transcripts) {
                const content = await this.tencentMeetingApi.fetchTextFromUrl(transcript.download_address);
                files.push({
                    fileName: `transcript_${recordingDetail.record_file_id}.${transcript.file_type}`,
                    fileType: FileType.TRANSCRIPT,
                    storageType: StorageType.URL,
                    downloadUrl: transcript.download_address,
                    content,
                    mimeType: `text/${transcript.file_type}`
                });
            }
        }

        // 处理AI会议纪要
        if (recordingDetail.ai_minutes) {
            for (const minutes of recordingDetail.ai_minutes) {
                const content = await this.tencentMeetingApi.fetchTextFromUrl(minutes.download_address);
                files.push({
                    fileName: `minutes_${recordingDetail.record_file_id}.${minutes.file_type}`,
                    fileType: FileType.SUMMARY,
                    storageType: StorageType.URL,
                    downloadUrl: minutes.download_address,
                    content,
                    mimeType: `text/${minutes.file_type}`
                });
            }
        }

        // 批量创建文件记录
        for (const file of files) {
            await this.meetingRepository.createMeetingFile({
                meetingRecordId,
                ...(file as any),
                processingStatus: ProcessingStatus.COMPLETED
            });
        }

        // 更新会议记录的AI处理结果
        const transcriptFile = files.find((f: any) => f.fileType === FileType.TRANSCRIPT);
        const summaryFile = files.find((f: any) => f.fileType === FileType.SUMMARY);

        if (transcriptFile || summaryFile) {
            await this.meetingRepository.updateMeetingRecord(meetingRecordId, {
                transcript: (transcriptFile as any)?.content,
                summary: (summaryFile as any)?.content || null
            });
        }

        this.logger.log(`处理了 ${files.length} 个文件`);
    }

    /**
     * 处理参会者信息
     */
    private async processParticipants(
        meetingRecordId: string,
        meetingId: string,
        hostUserId: string,
        subMeetingId?: string
    ): Promise<void> {
        try {
            const participantsData = await this.tencentMeetingApi.getMeetingParticipants(
                meetingId,
                hostUserId,
                subMeetingId
            );

            if (!participantsData?.participants?.length) {
                this.logger.log(`会议ID ${meetingId} 没有参会者信息`);
                return;
            }

            // 解码参会者名称
            const participants = participantsData.participants.map(participant => {
                try {
                    const decodedName = Buffer.from(participant.user_name, 'base64').toString('utf-8');
                    return {
                        ...participant,
                        user_name: decodedName
                    };
                } catch (error) {
                    this.logger.error(`解码参会者名称失败: ${participant.user_name}`, error);
                    return participant;
                }
            });

            // 更新会议记录的参会者信息
            await this.meetingRepository.updateMeetingRecord(meetingRecordId, {
                participantCount: participants.length,
                participantList: participants as any
            });

            this.logger.log(`处理了 ${participants.length} 个参会者`);
        } catch (error) {
            this.logger.error('处理参会者信息失败:', error);
        }
    }

    /**
     * 映射会议类型
     */
    private mapMeetingType(tencentMeetingType: number): MeetingType {
        // 根据腾讯会议的类型映射到我们的枚举
        switch (tencentMeetingType) {
            case 0:
                return MeetingType.INSTANT;
            case 1:
                return MeetingType.SCHEDULED;
            case 2:
                return MeetingType.RECURRING;
            default:
                return MeetingType.SCHEDULED;
        }
    }

    /**
     * 获取会议记录列表
     */
    async getMeetingRecords(params: {
        platform?: MeetingPlatform;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }) {
        return this.meetingRepository.getMeetingRecords(params);
    }

    /**
     * 获取会议记录详情
     */
    async getMeetingRecordById(id: string) {
        return this.meetingRepository.findMeetingById(id);
    }
}