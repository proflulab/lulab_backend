/**
 * @fileoverview Unit tests for MeetingRepository
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MeetingRepository } from './meeting.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MeetingPlatform,
  FileType,
  MeetingType,
  ProcessingStatus,
} from '@prisma/client';
import type {
  CreateMeetingRecordData,
  UpdateMeetingRecordData,
  CreateMeetingFileData,
  UpdateMeetingFileData,
  GetMeetingRecordsParams,
} from '@/meeting/types/meeting.types';

type PrismaMock = {
  meetings: {
    findUnique: jest.Mock;
    create: jest.Mock;
    upsert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  meetingFile: {
    create: jest.Mock;
    update: jest.Mock;
  };
};

describe('MeetingRepository', () => {
  let repository: MeetingRepository;
  let prisma: PrismaMock;

  // Mock data
  const mockMeeting = {
    id: 'meeting-123',
    platform: MeetingPlatform.TENCENT_MEETING,
    platformMeetingId: 'tencent-meeting-123',
    platformRecordingId: 'recording-123',
    title: 'Test Meeting',
    meetingCode: '123456789',
    type: MeetingType.SCHEDULED,
    hostUserId: 'user-123',
    hostUserName: 'John Doe',
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T11:00:00Z'),
    durationSeconds: 3600,
    hasRecording: true,
    recordingStatus: ProcessingStatus.COMPLETED,
    processingStatus: ProcessingStatus.COMPLETED,
    participantCount: 5,
    transcript: 'Meeting transcript',
    summary: 'Meeting summary',
    metadata: {},
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z'),
  };

  const mockMeetingFile = {
    id: 'file-123',
    meetingRecordId: 'meeting-123',
    fileName: 'recording.mp3',
    fileType: FileType.AUDIO,
    storageType: 'LOCAL',
    downloadUrl: 'https://example.com/recording.mp3',
    content: 'file content',
    mimeType: 'audio/mpeg',
    processingStatus: ProcessingStatus.COMPLETED,
    metadata: {},
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z'),
  };

  beforeEach(async () => {
    // Create mock Prisma service
    const mockPrismaService = {
      meetings: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      meetingFile: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<MeetingRepository>(MeetingRepository);
    prisma = module.get(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findMeetingByPlatformId', () => {
    it('should find meeting by platform and platform meeting ID', async () => {
      const platform = MeetingPlatform.TENCENT_MEETING;
      const platformMeetingId = 'tencent-meeting-123';

      prisma.meetings.findUnique.mockResolvedValue(mockMeeting);

      const result = await repository.findMeetingByPlatformId(
        platform,
        platformMeetingId,
      );

      expect(prisma.meetings.findUnique).toHaveBeenCalledWith({
        where: {
          platform_platformMeetingId: {
            platform,
            platformMeetingId,
          },
        },
      });
      expect(result).toEqual(mockMeeting);
    });

    it('should return null when meeting not found', async () => {
      const platform = MeetingPlatform.TENCENT_MEETING;
      const platformMeetingId = 'non-existent-meeting';

      prisma.meetings.findUnique.mockResolvedValue(null);

      const result = await repository.findMeetingByPlatformId(
        platform,
        platformMeetingId,
      );

      expect(result).toBeNull();
    });
  });

  describe('findMeetingById', () => {
    it('should find meeting by ID with files', async () => {
      const meetingWithFiles = {
        ...mockMeeting,
        files: [mockMeetingFile],
      };

      prisma.meetings.findUnique.mockResolvedValue(meetingWithFiles);

      const result = await repository.findMeetingById('meeting-123');

      expect(prisma.meetings.findUnique).toHaveBeenCalledWith({
        where: { id: 'meeting-123' },
        include: {
          files: true,
        },
      });
      expect(result).toEqual(meetingWithFiles);
    });

    it('should return null when meeting not found', async () => {
      prisma.meetings.findUnique.mockResolvedValue(null);

      const result = await repository.findMeetingById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('createMeetingRecord', () => {
    it('should create a new meeting record', async () => {
      const createData: CreateMeetingRecordData = {
        platform: MeetingPlatform.TENCENT_MEETING,
        platformMeetingId: 'new-meeting-123',
        title: 'New Meeting',
        meetingCode: '987654321',
        type: MeetingType.SCHEDULED,
        hostUserId: 'user-456',
        hostUserName: 'Jane Doe',
        startTime: new Date('2024-01-02T10:00:00Z'),
        endTime: new Date('2024-01-02T11:00:00Z'),
        durationSeconds: 3600,
        hasRecording: true,
        recordingStatus: ProcessingStatus.PENDING,
        processingStatus: ProcessingStatus.PENDING,
        metadata: {},
      };

      const createdMeeting = {
        ...createData,
        id: 'new-meeting-id',
        participantCount: 0,
        transcript: '',
        summary: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.meetings.create.mockResolvedValue(createdMeeting);

      const result = await repository.createMeetingRecord(createData);

      expect(prisma.meetings.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toEqual(createdMeeting);
    });
  });

  describe('upsertMeetingRecord', () => {
    it('should upsert meeting record successfully', async () => {
      const meta: Record<string, unknown> = {};
      const upsertData: CreateMeetingRecordData = {
        platform: MeetingPlatform.TENCENT_MEETING,
        platformMeetingId: 'upsert-meeting-123',
        title: 'Upsert Meeting',
        meetingCode: '111222333',
        type: MeetingType.SCHEDULED,
        hostUserId: 'user-789',
        hostUserName: 'Upsert User',
        startTime: new Date('2024-01-03T10:00:00Z'),
        endTime: new Date('2024-01-03T11:00:00Z'),
        durationSeconds: 3600,
        hasRecording: true,
        recordingStatus: ProcessingStatus.PENDING,
        processingStatus: ProcessingStatus.PENDING,
        metadata: meta,
      };

      const upsertedMeeting = {
        ...upsertData,
        id: 'upserted-meeting-id',
        participantCount: 4,
        transcript: '',
        summary: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.meetings.upsert.mockResolvedValue(upsertedMeeting);

      const result = await repository.upsertMeetingRecord(upsertData);

      expect(prisma.meetings.upsert).toHaveBeenCalledWith({
        where: {
          platform_platformMeetingId: {
            platform: upsertData.platform,
            platformMeetingId: upsertData.platformMeetingId,
          },
        },
        update: {
          title: upsertData.title,
          meetingCode: upsertData.meetingCode,
          type: upsertData.type,
          hostUserId: upsertData.hostUserId,
          hostUserName: upsertData.hostUserName,
          startTime: upsertData.startTime,
          endTime: upsertData.endTime,
          durationSeconds: upsertData.durationSeconds,
          hasRecording: upsertData.hasRecording,
          recordingStatus: upsertData.recordingStatus,
          processingStatus: upsertData.processingStatus,
          metadata: meta,
        },
        create: upsertData,
        include: {
          files: true,
        },
      });
      expect(result).toEqual(upsertedMeeting);
    });
  });

  describe('updateMeetingRecord', () => {
    it('should update meeting record successfully', async () => {
      const updateData: UpdateMeetingRecordData = {
        participantCount: 10,
        transcript: 'Updated transcript',
        summary: 'Updated summary',
      };

      const updatedMeeting = {
        ...mockMeeting,
        ...updateData,
        updatedAt: new Date(),
      };

      prisma.meetings.update.mockResolvedValue(updatedMeeting);

      const result = await repository.updateMeetingRecord(
        'meeting-123',
        updateData,
      );

      expect(prisma.meetings.update).toHaveBeenCalledWith({
        where: { id: 'meeting-123' },
        data: updateData,
      });
      expect(result).toEqual(updatedMeeting);
    });
  });

  describe('createMeetingFile', () => {
    it('should create a new meeting file', async () => {
      const createFileData: CreateMeetingFileData = {
        meetingRecordId: 'meeting-123',
        fileName: 'new-recording.mp3',
        fileType: FileType.AUDIO,
        storageType: 'LOCAL',
        downloadUrl: 'https://example.com/new-recording.mp3',
        content: 'file content',
        mimeType: 'audio/mpeg',
        processingStatus: ProcessingStatus.PENDING,
      };

      const createdFile = {
        ...createFileData,
        id: 'new-file-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.meetingFile.create.mockResolvedValue(createdFile);

      const result = await repository.createMeetingFile(createFileData);

      expect(prisma.meetingFile.create).toHaveBeenCalledWith({
        data: createFileData,
      });
      expect(result).toEqual(createdFile);
    });
  });

  describe('updateMeetingFile', () => {
    it('should update meeting file successfully', async () => {
      const updateFileData: UpdateMeetingFileData = {
        fileName: 'updated-recording.mp3',
        processingStatus: ProcessingStatus.COMPLETED,
        metadata: { updated: true },
      };

      const updatedFile = {
        ...mockMeetingFile,
        ...updateFileData,
        updatedAt: new Date(),
      };

      prisma.meetingFile.update.mockResolvedValue(updatedFile);

      const result = await repository.updateMeetingFile(
        'file-123',
        updateFileData,
      );

      expect(prisma.meetingFile.update).toHaveBeenCalledWith({
        where: { id: 'file-123' },
        data: updateFileData,
      });
      expect(result).toEqual(updatedFile);
    });
  });

  describe('deleteMeetingRecord', () => {
    it('should delete meeting record successfully', async () => {
      const deletedMeeting = {
        ...mockMeeting,
        deletedAt: new Date(),
      };

      prisma.meetings.delete.mockResolvedValue(deletedMeeting);

      const result = await repository.deleteMeetingRecord('meeting-123');

      expect(prisma.meetings.delete).toHaveBeenCalledWith({
        where: { id: 'meeting-123' },
      });
      expect(result).toEqual(deletedMeeting);
    });
  });

  describe('getMeetingRecords', () => {
    it('should get meeting records with pagination', async () => {
      const params: GetMeetingRecordsParams = {
        page: 1,
        limit: 10,
      };

      const mockRecords = [
        { ...mockMeeting, files: [mockMeetingFile] },
        {
          ...mockMeeting,
          id: 'meeting-456',
          platformMeetingId: 'tencent-meeting-456',
          files: [],
        },
      ];

      prisma.meetings.findMany.mockResolvedValue(mockRecords);
      prisma.meetings.count.mockResolvedValue(25);

      const result = await repository.getMeetingRecords(params);

      expect(prisma.meetings.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          files: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
      });
      expect(prisma.meetings.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        records: mockRecords,
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      });
    });

    it('should filter by platform', async () => {
      const params: GetMeetingRecordsParams = {
        platform: MeetingPlatform.TENCENT_MEETING,
        page: 1,
        limit: 10,
      };

      const mockRecords = [{ ...mockMeeting, files: [] }];

      prisma.meetings.findMany.mockResolvedValue(mockRecords);
      prisma.meetings.count.mockResolvedValue(1);

      const result = await repository.getMeetingRecords(params);

      expect(prisma.meetings.findMany).toHaveBeenCalledWith({
        where: {
          platform: MeetingPlatform.TENCENT_MEETING,
        },
        include: {
          files: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
      });
      expect(result.records).toEqual(mockRecords);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');
      const params: GetMeetingRecordsParams = {
        startDate,
        endDate,
        page: 1,
        limit: 10,
      };

      const mockRecords = [{ ...mockMeeting, files: [] }];

      prisma.meetings.findMany.mockResolvedValue(mockRecords);
      prisma.meetings.count.mockResolvedValue(1);

      const result = await repository.getMeetingRecords(params);

      expect(prisma.meetings.findMany).toHaveBeenCalledWith({
        where: {
          startTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          files: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
      });
      expect(result.records).toEqual(mockRecords);
    });

    it('should handle pagination correctly', async () => {
      const params: GetMeetingRecordsParams = {
        page: 3,
        limit: 5,
      };

      const mockRecords = [{ ...mockMeeting, files: [] }];

      prisma.meetings.findMany.mockResolvedValue(mockRecords);
      prisma.meetings.count.mockResolvedValue(15);

      const result = await repository.getMeetingRecords(params);

      expect(prisma.meetings.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          files: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 10, // (3-1) * 5 = 10
        take: 5,
      });
      expect(result).toEqual({
        records: mockRecords,
        total: 15,
        page: 3,
        limit: 5,
        totalPages: 3, // Math.ceil(15/5) = 3
      });
    });

    it('should use default pagination values when not provided', async () => {
      const params: GetMeetingRecordsParams = {};

      const mockRecords = Array(10)
        .fill(null)
        .map((_, index) => ({
          ...mockMeeting,
          id: `meeting-${index}`,
          platformMeetingId: `tencent-meeting-${index}`,
          files: [],
        }));

      prisma.meetings.findMany.mockResolvedValue(mockRecords);
      prisma.meetings.count.mockResolvedValue(10);

      const result = await repository.getMeetingRecords(params);

      expect(prisma.meetings.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          files: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0, // (1-1) * 10 = 0
        take: 10,
      });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
});
