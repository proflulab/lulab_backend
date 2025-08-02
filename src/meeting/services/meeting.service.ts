import { Injectable } from '@nestjs/common';
import {
    ProcessingStatus
} from '@prisma/client';
import { MeetingRepository } from '../repositories/meeting.repository';
import {
    GetMeetingRecordsParams
} from '../types/meeting.types';
import { CreateMeetingRecordDto } from '../dto/common/create-meeting-record.dto';
import { UpdateMeetingRecordDto } from '../dto/common/update-meeting-record.dto';
import {
    MeetingRecordNotFoundException,
    MeetingRecordAlreadyExistsException
} from '../exceptions/meeting.exceptions';

/**
 * 核心会议服务
 * 负责协调各平台服务和文件处理器
 */
@Injectable()
export class MeetingService {

    constructor(
        private readonly meetingRepository: MeetingRepository,
    ) { }

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
                ''
            );
        }

        // 转换DTO到repository数据格式
        const createData = {
            platform: params.platform,
            platformMeetingId: params.platformMeetingId,
            title: params.title,
            meetingCode: params.meetingCode || '',
            type: params.type,
            hostUserId: params.hostUserId || '',
            hostUserName: params.hostUserName,
            startTime: params.actualStartAt ? new Date(params.actualStartAt) : new Date(),
            endTime: params.endedAt ? new Date(params.endedAt) : new Date(),
            durationSeconds: params.duration || 0,
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