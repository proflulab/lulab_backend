import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    MeetingPlatform,
    MeetingType,
    FileType,
    StorageType,
    ProcessingStatus
} from '@prisma/client';
import { TencentApiService } from './tencent-api.service';
import {
    RecordingDetail,
    RecordMeetingsResponse,
    MeetingParticipantsResponse,
    MeetingDetailResponse
} from '../../../types/tencent.types';
import {
    PlatformApiException,
    PlatformConfigException,
    RecordingFileProcessingException
} from '../../../exceptions/meeting.exceptions';
import { HttpFileUtil } from '../../../utils/http-file.util';
import {
    CreateMeetingFileParams,
    ProcessRecordingFileParams
} from '../../../types/meeting.types';
import { MeetingRepository } from '../../../repositories/meeting.repository';
import { FileProcessorFactory } from '../../../processors/file-processor.factory';

/**
 * 腾讯会议平台服务
 * 封装腾讯会议API调用和业务逻辑
 */
@Injectable()
export class TencentMeetingService {
    private readonly logger = new Logger(TencentMeetingService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly tencentApiService: TencentApiService,
        private readonly meetingRepository: MeetingRepository,
        private readonly fileProcessorFactory: FileProcessorFactory
    ) {
        this.validateConfig();
    }

    /**
     * 验证配置
     */
    private validateConfig(): void {
        const requiredConfigs = [
            'TENCENT_MEETING_SECRET_ID',
            'TENCENT_MEETING_SECRET_KEY',
            'TENCENT_MEETING_APP_ID',
            'TENCENT_MEETING_SDK_ID',
            'TENCENT_MEETING_TOKEN',
            'TENCENT_MEETING_ENCODING_AES_KEY'
        ];

        const missingConfigs = requiredConfigs.filter(
            config => !this.configService.get<string>(config)
        );

        if (missingConfigs.length > 0) {
            throw new PlatformConfigException(
                'TENCENT_MEETING',
                missingConfigs.join(', ')
            );
        }
    }

    /**
     * 获取录制文件详情
     * @param fileId 录制文件ID
     * @param userId 用户ID
     * @returns 录制详情信息
     */
    async getRecordingFileDetail(fileId: string, userId: string): Promise<RecordingDetail> {
        try {
            this.logger.log(`获取录制文件详情: ${fileId}`);
            const result = await this.tencentApiService.getRecordingFileDetail(fileId, userId);
            this.logger.log(`成功获取录制文件详情: ${fileId}`);
            return result;
        } catch (error) {
            this.logger.error(`获取录制文件详情失败: ${fileId}`, error);
            throw new PlatformApiException(
                'TENCENT_MEETING',
                'getRecordingFileDetail',
                error.message
            );
        }
    }

    /**
     * 获取账户级会议录制列表
     * @param startTime 查询起始时间戳（单位秒）
     * @param endTime 查询结束时间戳（单位秒）
     * @param pageSize 分页大小，默认10，最大20
     * @param page 页码，从1开始，默认1
     * @param operatorId 操作者ID
     * @param operatorIdType 操作者ID类型
     * @returns 会议录制列表响应
     */
    async getCorpRecords(
        startTime: number,
        endTime: number,
        pageSize: number = 10,
        page: number = 1,
        operatorId?: string,
        operatorIdType: number = 1
    ): Promise<RecordMeetingsResponse> {
        try {
            this.logger.log(`获取会议录制列表: ${startTime} - ${endTime}`);
            const result = await this.tencentApiService.getCorpRecords(
                startTime,
                endTime,
                pageSize,
                page,
                operatorId,
                operatorIdType
            );
            this.logger.log(`成功获取会议录制列表，共 ${result.total_count} 条记录`);
            return result;
        } catch (error) {
            this.logger.error(`获取会议录制列表失败`, error);
            throw new PlatformApiException(
                'TENCENT_MEETING',
                'getCorpRecords',
                error.message
            );
        }
    }

    /**
     * 获取会议详情
     * @param meetingId 会议ID
     * @param userId 用户ID
     * @param instanceId 实例ID，默认为"1"
     * @returns 会议详情响应
     */
    async getMeetingDetail(
        meetingId: string,
        userId: string,
        instanceId: string = "1"
    ): Promise<MeetingDetailResponse> {
        try {
            this.logger.log(`获取会议详情: ${meetingId}`);
            const result = await this.tencentApiService.getMeetingDetail(meetingId, userId, instanceId);
            this.logger.log(`成功获取会议详情: ${meetingId}`);
            return result;
        } catch (error) {
            this.logger.error(`获取会议详情失败: ${meetingId}`, error);
            throw new PlatformApiException(
                'TENCENT_MEETING',
                'getMeetingDetail',
                error.message
            );
        }
    }

    /**
     * 获取会议参会成员列表
     * @param meetingId 会议ID
     * @param userId 用户ID
     * @param subMeetingId 子会议ID（可选）
     * @returns 参会成员列表响应
     */
    async getMeetingParticipants(
        meetingId: string,
        userId: string,
        subMeetingId?: string | null
    ): Promise<MeetingParticipantsResponse> {
        try {
            this.logger.log(`获取会议参会成员列表: ${meetingId}`);
            const result = await this.tencentApiService.getMeetingParticipants(meetingId, userId, subMeetingId);
            this.logger.log(`成功获取会议参会成员列表: ${meetingId}，共 ${result.total_count} 人`);
            return result;
        } catch (error) {
            this.logger.error(`获取会议参会成员列表失败: ${meetingId}`, error);
            throw new PlatformApiException(
                'TENCENT_MEETING',
                'getMeetingParticipants',
                error.message
            );
        }
    }

    /**
     * 从URL获取文本内容
     * @param url 文件URL
     * @returns 文本内容
     */
    async fetchTextFromUrl(url: string): Promise<string> {
        try {
            this.logger.log(`从URL获取文本内容: ${url}`);
            const result = await HttpFileUtil.fetchTextFromUrl(url);
            this.logger.log(`成功从URL获取文本内容，长度: ${result.length}`);
            return result;
        } catch (error) {
            this.logger.error(`从URL获取文本内容失败: ${url}`, error);
            throw new PlatformApiException(
                'TENCENT_MEETING',
                'fetchTextFromUrl',
                error.message
            );
        }
    }

    /**
     * 测试API连接
     * @returns 连接状态
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            // 使用一个简单的API调用来测试连接
            const endTime = Math.floor(Date.now() / 1000);
            const startTime = endTime - 24 * 60 * 60; // 24小时前

            await this.getCorpRecords(startTime, endTime, 1, 1);

            return {
                success: true,
                message: 'Tencent Meeting API connection successful'
            };
        } catch (error) {
            this.logger.error('腾讯会议API连接测试失败', error);
            return {
                success: false,
                message: `Tencent Meeting API connection failed: ${error.message}`
            };
        }
    }

    /**
     * 获取配置状态
     * @returns 配置状态信息
     */
    getConfigStatus(): {
        configured: boolean;
        missingConfigs: string[];
        availableConfigs: string[];
    } {
        const requiredConfigs = [
            'TENCENT_MEETING_SECRET_ID',
            'TENCENT_MEETING_SECRET_KEY',
            'TENCENT_MEETING_APP_ID',
            'TENCENT_MEETING_SDK_ID',
            'TENCENT_MEETING_TOKEN',
            'TENCENT_MEETING_ENCODING_AES_KEY'
        ];

        const availableConfigs = requiredConfigs.filter(
            config => !!this.configService.get<string>(config)
        );

        const missingConfigs = requiredConfigs.filter(
            config => !this.configService.get<string>(config)
        );

        return {
            configured: missingConfigs.length === 0,
            missingConfigs,
            availableConfigs
        };
    }

    /**
     * 处理单个录制文件
     */
    async processRecordingFile(params: ProcessRecordingFileParams): Promise<void> {
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
        const recordingDetail = await this.getRecordingFileDetail(
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
                const content = await this.fetchTextFromUrl(summary.download_address);
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
                const content = await this.fetchTextFromUrl(transcript.download_address);
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
                const content = await this.fetchTextFromUrl(minutes.download_address);
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
            const participantsData = await this.getMeetingParticipants(
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
}