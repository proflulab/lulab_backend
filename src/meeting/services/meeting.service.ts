import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    MeetingPlatform,
    MeetingType,
    FileType,
    StorageType,
    ProcessingStatus
} from '@prisma/client';
import { MeetingRepository, UpdateMeetingFileData } from '../repositories/meeting.repository';
import { TencentMeetingService } from './platforms/tencent/tencent-meeting.service';
import { FileProcessorFactory } from '../processors/file-processor.factory';
import { IFileProcessor } from '../processors/file-processor.interface';
import {
    CreateMeetingFileParams,
    GetMeetingRecordsParams,
    ProcessRecordingFileParams
} from '../types/meeting.types';
import { CreateMeetingRecordDto } from '../dto/common/create-meeting-record.dto';
import { UpdateMeetingRecordDto } from '../dto/common/update-meeting-record.dto';
import {
    MeetingRecordNotFoundException,
    MeetingRecordAlreadyExistsException,
    RecordingFileProcessingException
} from '../exceptions/meeting.exceptions';

/**
 * 核心会议服务
 * 负责协调各平台服务和文件处理器
 */
@Injectable()
export class MeetingService {
    private readonly logger = new Logger(MeetingService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly meetingRepository: MeetingRepository,
        private readonly tencentMeetingService: TencentMeetingService,
        private readonly fileProcessorFactory: FileProcessorFactory
    ) {}



    /**
     * 处理腾讯会议录制完成事件
     */
    async handleTencentRecordingCompleted(eventData: any): Promise<void> {
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

        this.logger.log('腾讯会议录制完成事件处理完毕');
    }

    /**
     * 处理单个录制文件
     */
    private async processRecordingFile(params: ProcessRecordingFileParams): Promise<void> {
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
            const createData = {
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
            };

            meetingRecord = await this.meetingRepository.createMeetingRecord(createData);
            this.logger.log(`创建会议记录: ${meetingRecord.id}`);
        }

        // 获取录制文件详情
        const recordingDetail = await this.tencentMeetingService.getRecordingFileDetail(
            recordFileId,
            hostUserId
        );

        // 处理各种类型的文件
        await this.processRecordingFiles(meetingRecord.id, recordingDetail);

        // 获取参会者信息
        await this.processParticipants(meetingRecord.id, meetingId, hostUserId, subMeetingId);

        // 更新会议记录状态
        const updateData = {
            recordingStatus: ProcessingStatus.COMPLETED,
            processingStatus: ProcessingStatus.COMPLETED
        };
        await this.meetingRepository.updateMeetingRecord(meetingRecord.id, updateData);

        this.logger.log(`会议记录处理完成: ${meetingRecord.id}`);
    }

    /**
     * 处理录制文件
     */
    private async processRecordingFiles(meetingRecordId: string, recordingDetail: any): Promise<void> {
        const files: CreateMeetingFileParams[] = [];

        // 处理视频文件
        if (recordingDetail.download_address) {
            files.push({
                meetingRecordId,
                fileName: `recording_${recordingDetail.record_file_id}.${recordingDetail.download_address_file_type || 'mp4'}`,
                fileType: FileType.VIDEO,
                storageType: StorageType.URL,
                downloadUrl: recordingDetail.download_address,
                mimeType: `video/${recordingDetail.download_address_file_type || 'mp4'}`,
                processingStatus: ProcessingStatus.PENDING
            });
        }

        // 处理音频文件
        if (recordingDetail.audio_address) {
            files.push({
                meetingRecordId,
                fileName: `audio_${recordingDetail.record_file_id}.${recordingDetail.audio_address_file_type || 'mp3'}`,
                fileType: FileType.AUDIO,
                storageType: StorageType.URL,
                downloadUrl: recordingDetail.audio_address,
                mimeType: `audio/${recordingDetail.audio_address_file_type || 'mp3'}`,
                processingStatus: ProcessingStatus.PENDING
            });
        }

        // 处理会议纪要
        if (recordingDetail.meeting_summary) {
            for (const summary of recordingDetail.meeting_summary) {
                const content = await this.tencentMeetingService.fetchTextFromUrl(summary.download_address);
                files.push({
                    meetingRecordId,
                    fileName: `summary_${recordingDetail.record_file_id}.${summary.file_type}`,
                    fileType: FileType.SUMMARY,
                    storageType: StorageType.URL,
                    downloadUrl: summary.download_address,
                    content,
                    mimeType: `text/${summary.file_type}`,
                    processingStatus: ProcessingStatus.PENDING
                });
            }
        }

        // 处理AI转录
        if (recordingDetail.ai_meeting_transcripts) {
            for (const transcript of recordingDetail.ai_meeting_transcripts) {
                const content = await this.tencentMeetingService.fetchTextFromUrl(transcript.download_address);
                files.push({
                    meetingRecordId,
                    fileName: `transcript_${recordingDetail.record_file_id}.${transcript.file_type}`,
                    fileType: FileType.TRANSCRIPT,
                    storageType: StorageType.URL,
                    downloadUrl: transcript.download_address,
                    content,
                    mimeType: `text/${transcript.file_type}`,
                    processingStatus: ProcessingStatus.PENDING
                });
            }
        }

        // 处理AI会议纪要
        if (recordingDetail.ai_minutes) {
            for (const minutes of recordingDetail.ai_minutes) {
                const content = await this.tencentMeetingService.fetchTextFromUrl(minutes.download_address);
                files.push({
                    meetingRecordId,
                    fileName: `minutes_${recordingDetail.record_file_id}.${minutes.file_type}`,
                    fileType: FileType.SUMMARY,
                    storageType: StorageType.URL,
                    downloadUrl: minutes.download_address,
                    content,
                    mimeType: `text/${minutes.file_type}`,
                    processingStatus: ProcessingStatus.PENDING
                });
            }
        }

        // 批量创建文件记录并处理
        for (const fileParams of files) {
            try {
                const meetingFile = await this.meetingRepository.createMeetingFile(fileParams);

                // 使用对应的文件处理器处理文件
                await this.processFileWithProcessor(meetingFile.id, fileParams);
            } catch (error) {
                this.logger.error(`创建或处理文件失败: ${fileParams.fileName}`, error);
                throw new RecordingFileProcessingException(fileParams.fileName, error.message);
            }
        }

        // 更新会议记录的AI处理结果
        const transcriptFile = files.find(f => f.fileType === FileType.TRANSCRIPT);
        const summaryFile = files.find(f => f.fileType === FileType.SUMMARY);

        if (transcriptFile || summaryFile) {
            const updateData = {
                transcript: transcriptFile?.content,
                summary: summaryFile?.content
            };
            await this.meetingRepository.updateMeetingRecord(meetingRecordId, updateData);
        }

        this.logger.log(`处理了 ${files.length} 个文件`);
    }

    /**
     * 使用文件处理器处理文件
     */
    private async processFileWithProcessor(
        fileId: string,
        fileParams: CreateMeetingFileParams
    ): Promise<void> {
        const processor = this.fileProcessorFactory.getProcessor(
            fileParams.fileType,
            fileParams.mimeType
        );
        if (!processor) {
            this.logger.warn(
                `没有找到文件类型 ${fileParams.fileType}/${fileParams.mimeType} 的处理器`
            );
            await this.meetingRepository.updateMeetingFile(fileId, {
                processingStatus: ProcessingStatus.FAILED
            });
            return;
        }

        try {
            const result = await processor.process({
                fileId,
                fileName: fileParams.fileName,
                fileType: fileParams.fileType,
                downloadUrl: fileParams.downloadUrl,
                content: fileParams.content,
                mimeType: fileParams.mimeType,
                meetingRecordId: fileParams.meetingRecordId
            });

            // 更新文件处理状态和结果
            await this.meetingRepository.updateMeetingFile(fileId, {
                processingStatus: result.processingStatus,
                content: result.content,
                metadata: result.metadata
            });

            if (!result.success) {
                this.logger.error(`文件处理失败: ${fileParams.fileName}, 错误: ${result.error}`);
            }
        } catch (error) {
            this.logger.error(`文件处理器执行失败: ${fileParams.fileName}`, error);
            await this.meetingRepository.updateMeetingFile(fileId, {
                processingStatus: ProcessingStatus.FAILED
            });
        }
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
            const participantsData = await this.tencentMeetingService.getMeetingParticipants(
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
            const updateData = {
                participantCount: participants.length,
                participantList: participants
            };
            await this.meetingRepository.updateMeetingRecord(meetingRecordId, updateData);

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
    async getMeetingRecords(params: GetMeetingRecordsParams) {
        return this.meetingRepository.getMeetingRecords(params);
    }

    /**
     * 获取会议记录详情
     */
    async getMeetingRecordById(id: string) {
        const record = await this.meetingRepository.findMeetingById(id);
        if (!record) {
            throw new MeetingRecordNotFoundException(id);
        }
        return record;
    }

    /**
     * 创建会议记录
     */
    async createMeetingRecord(params: CreateMeetingRecordDto) {
        // 检查是否已存在
        const existing = await this.meetingRepository.findMeetingByPlatformId(
            params.platform,
            params.platformMeetingId
        );

        if (existing) {
            throw new MeetingRecordAlreadyExistsException(
                params.platformMeetingId,
                params.platformRecordingId || ''
            );
        }

        // 转换DTO到repository数据格式
        const createData = {
            platform: params.platform,
            platformMeetingId: params.platformMeetingId,
            platformRecordingId: params.platformRecordingId || '',
            title: params.title,
            meetingCode: params.meetingCode || '',
            type: params.type,
            hostUserId: params.hostUserId || '',
            hostUserName: params.hostUserName,
            actualStartAt: params.actualStartAt ? new Date(params.actualStartAt) : new Date(),
            endedAt: params.endedAt ? new Date(params.endedAt) : new Date(),
            duration: params.duration || 0,
            hasRecording: params.hasRecording || false,
            recordingStatus: params.recordingStatus || ProcessingStatus.PENDING,
            processingStatus: params.processingStatus || ProcessingStatus.PENDING,
            metadata: params.metadata
        };

        return this.meetingRepository.createMeetingRecord(createData);
    }

    /**
     * 更新会议记录
     */
    async updateMeetingRecord(id: string, params: UpdateMeetingRecordDto) {
        const record = await this.meetingRepository.findMeetingById(id);
        if (!record) {
            throw new MeetingRecordNotFoundException(id);
        }

        // 转换DTO到repository数据格式
        const updateData: any = {};
        if (params.recordingStatus !== undefined) updateData.recordingStatus = params.recordingStatus;
        if (params.processingStatus !== undefined) updateData.processingStatus = params.processingStatus;
        if (params.participantCount !== undefined) updateData.participantCount = params.participantCount;
        if (params.participantList !== undefined) updateData.participantList = params.participantList;
        if (params.transcript !== undefined) updateData.transcript = params.transcript;
        if (params.summary !== undefined) updateData.summary = params.summary;

        // 处理其他字段
        if (params.title !== undefined) {
            updateData.title = params.title;
        }
        if (params.meetingCode !== undefined) {
            updateData.meetingCode = params.meetingCode;
        }
        if (params.type !== undefined) {
            updateData.type = params.type;
        }
        if (params.hostUserId !== undefined) {
            updateData.hostUserId = params.hostUserId;
        }
        if (params.hostUserName !== undefined) {
            updateData.hostUserName = params.hostUserName;
        }
        if (params.actualStartAt !== undefined) {
            updateData.actualStartAt = new Date(params.actualStartAt);
        }
        if (params.endedAt !== undefined) {
            updateData.endedAt = new Date(params.endedAt);
        }
        if (params.duration !== undefined) {
            updateData.duration = params.duration;
        }
        if (params.metadata !== undefined) {
            updateData.metadata = params.metadata;
        }

        return this.meetingRepository.updateMeetingRecord(id, updateData);
    }

    /**
     * 删除会议记录
     */
    async deleteMeetingRecord(id: string) {
        const record = await this.meetingRepository.findMeetingById(id);
        if (!record) {
            throw new MeetingRecordNotFoundException(id);
        }

        return this.meetingRepository.deleteMeetingRecord(id);
    }

    /**
     * 获取会议统计信息
     */
    async getMeetingStats(params: any) {
        // 实现统计逻辑
        return {
            totalMeetings: 0,
            totalDuration: 0,
            platformStats: {},
            monthlyStats: []
        };
    }

    /**
     * 重新处理会议记录
     */
    async reprocessMeetingRecord(id: string) {
        const record = await this.meetingRepository.findMeetingById(id);
        if (!record) {
            throw new MeetingRecordNotFoundException(id);
        }

        // 重置处理状态
        await this.meetingRepository.updateMeetingRecord(id, {
            processingStatus: ProcessingStatus.PROCESSING
        });

        // 重新处理录制文件
        // 这里可以根据需要重新调用处理逻辑

        return record;
    }
}