import { TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { MeetingModule } from '@/meeting/meeting.module';
import { MeetingRepository } from '@/meeting/repositories/meeting.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { MeetingPlatform, MeetingType, ProcessingStatus } from '@prisma/client';
import type {
  CreateMeetingRecordData,
  UpdateMeetingRecordData,
  GetMeetingRecordsParams,
} from '@/meeting/types/meeting.types';
import { createTestApp, closeTestApp } from '@/../test/helpers/test-app.helper';

describe('MeetingRepository Integration', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let repository: MeetingRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const { app: nestApp, module } = await createTestApp([MeetingModule]);
    app = nestApp;
    moduleRef = module;
    repository = moduleRef.get(MeetingRepository);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    await prisma.meetingFile.deleteMany({});
    await prisma.meetings.deleteMany({});
  });

  it('creates and fetches a meeting record', async () => {
    const data: CreateMeetingRecordData = {
      platform: MeetingPlatform.TENCENT_MEETING,
      platformMeetingId: 'int-meeting-1',
      title: 'Integration Test Meeting',
      meetingCode: 'CODE123',
      type: MeetingType.SCHEDULED,
      hostUserId: 'host-1',
      hostUserName: 'Host User',
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-01-01T11:00:00Z'),
      durationSeconds: 3600,
      hasRecording: false,
      recordingStatus: ProcessingStatus.PENDING,
      processingStatus: ProcessingStatus.PENDING,
      metadata: { source: 'integration' },
    };

    const created = await repository.createMeetingRecord(data);
    const fetched = await repository.findMeetingById(created.id);

    expect(fetched?.id).toBe(created.id);
    expect(fetched?.platform).toBe(MeetingPlatform.TENCENT_MEETING);
    expect(fetched?.title).toBe('Integration Test Meeting');
  });

  it('upserts a meeting record by composite unique key', async () => {
    const base: CreateMeetingRecordData = {
      platform: MeetingPlatform.TENCENT_MEETING,
      platformMeetingId: 'int-meeting-2',
      title: 'Initial Title',
      meetingCode: 'CODE456',
      type: MeetingType.SCHEDULED,
      hostUserId: 'host-2',
      hostUserName: 'Host Two',
      startTime: new Date('2025-01-02T10:00:00Z'),
      endTime: new Date('2025-01-02T11:00:00Z'),
      durationSeconds: 3600,
      hasRecording: true,
      recordingStatus: ProcessingStatus.PENDING,
      processingStatus: ProcessingStatus.PENDING,
      metadata: {},
    };

    const created = await repository.upsertMeetingRecord(base);
    const updatedInput: CreateMeetingRecordData = {
      ...base,
      title: 'Updated Title',
      processingStatus: ProcessingStatus.COMPLETED,
    };
    const upserted = await repository.upsertMeetingRecord(updatedInput);

    expect(upserted.id).toBe(created.id);
    expect(upserted.title).toBe('Updated Title');
    expect(upserted.processingStatus).toBe(ProcessingStatus.COMPLETED);
  });

  it('updates a meeting record fields', async () => {
    const data: CreateMeetingRecordData = {
      platform: MeetingPlatform.TENCENT_MEETING,
      platformMeetingId: 'int-meeting-3',
      title: 'To Update',
      meetingCode: 'CODE789',
      type: MeetingType.SCHEDULED,
      hostUserId: 'host-3',
      hostUserName: 'Host Three',
      startTime: new Date('2025-01-03T10:00:00Z'),
      endTime: new Date('2025-01-03T11:00:00Z'),
      durationSeconds: 3600,
      hasRecording: false,
      recordingStatus: ProcessingStatus.PENDING,
      processingStatus: ProcessingStatus.PENDING,
      metadata: {},
    };
    const created = await repository.createMeetingRecord(data);

    const update: UpdateMeetingRecordData = {
      participantCount: 8,
      processingStatus: ProcessingStatus.PROCESSING,
      recordingStatus: ProcessingStatus.PROCESSING,
    };

    const updated = await repository.updateMeetingRecord(created.id, update);
    expect(updated.participantCount).toBe(8);
    expect(updated.processingStatus).toBe(ProcessingStatus.PROCESSING);
    expect(updated.recordingStatus).toBe(ProcessingStatus.PROCESSING);
  });

  it('deletes a meeting record', async () => {
    const data: CreateMeetingRecordData = {
      platform: MeetingPlatform.TENCENT_MEETING,
      platformMeetingId: 'int-meeting-5',
      title: 'Delete Test',
      meetingCode: 'DEL123',
      type: MeetingType.SCHEDULED,
      hostUserId: 'host-5',
      hostUserName: 'Host Five',
      startTime: new Date('2025-01-05T10:00:00Z'),
      endTime: new Date('2025-01-05T11:00:00Z'),
      durationSeconds: 3600,
      hasRecording: false,
      recordingStatus: ProcessingStatus.PENDING,
      processingStatus: ProcessingStatus.PENDING,
      metadata: {},
    };
    const created = await repository.createMeetingRecord(data);
    await repository.deleteMeetingRecord(created.id);
    const fetched = await repository.findMeetingById(created.id);
    expect(fetched).toBeNull();
  });

  it('lists meeting records with pagination and filters', async () => {
    const base = {
      platform: MeetingPlatform.TENCENT_MEETING,
      type: MeetingType.SCHEDULED,
      hostUserId: 'host',
      hostUserName: 'Host',
      durationSeconds: 1800,
      hasRecording: false,
      recordingStatus: ProcessingStatus.PENDING,
      processingStatus: ProcessingStatus.PENDING,
      metadata: {},
    };

    const records: CreateMeetingRecordData[] = [
      {
        ...base,
        platformMeetingId: 'list-1',
        title: 'List 1',
        meetingCode: 'L1',
        startTime: new Date('2025-02-01T10:00:00Z'),
        endTime: new Date('2025-02-01T10:30:00Z'),
      },
      {
        ...base,
        platformMeetingId: 'list-2',
        title: 'List 2',
        meetingCode: 'L2',
        startTime: new Date('2025-02-10T10:00:00Z'),
        endTime: new Date('2025-02-10T10:30:00Z'),
      },
      {
        ...base,
        platformMeetingId: 'list-3',
        title: 'List 3',
        meetingCode: 'L3',
        startTime: new Date('2025-02-20T10:00:00Z'),
        endTime: new Date('2025-02-20T10:30:00Z'),
      },
    ];

    for (const r of records) {
      await repository.createMeetingRecord(r);
    }

    const params: GetMeetingRecordsParams = {
      page: 1,
      limit: 2,
    };
    const result = await repository.getMeetingRecords(params);
    expect(result.records.length).toBe(2);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);

    const dateFiltered = await repository.getMeetingRecords({
      startDate: new Date('2025-02-05T00:00:00Z'),
      endDate: new Date('2025-02-15T23:59:59Z'),
      page: 1,
      limit: 10,
    });
    expect(dateFiltered.records.length).toBe(1);
    const firstRecord = dateFiltered.records[0] as {
      platformMeetingId: string;
    };
    expect(firstRecord.platformMeetingId).toBe('list-2');
  });
});
