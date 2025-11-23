import { Test, TestingModule } from '@nestjs/testing';
import { MeetingFileRepository } from './meeting-file.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { FileType, ProcessingStatus } from '@prisma/client';
import type {
  CreateMeetingFileData,
  UpdateMeetingFileData,
} from '@/meeting/types/meeting.types';

type PrismaMock = {
  meetingFile: {
    create: jest.Mock;
    update: jest.Mock;
  };
};

describe('MeetingFileRepository', () => {
  let repository: MeetingFileRepository;
  let prisma: PrismaMock;

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
    const mockPrismaService = {
      meetingFile: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingFileRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<MeetingFileRepository>(MeetingFileRepository);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
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
});
