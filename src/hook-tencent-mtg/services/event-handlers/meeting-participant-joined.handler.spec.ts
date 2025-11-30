import { Test, TestingModule } from '@nestjs/testing';
import { MeetingParticipantJoinedHandler } from './meeting-participant-joined.handler';
import { MeetingBitableRepository } from '@/integrations/lark/repositories/meeting.repository';
import { TencentMeetingQueueService } from '../tencent-meeting-queue.service';
import { TencentEventPayload } from '../../types/tencent-webhook-events.types';

describe('MeetingParticipantJoinedHandler', () => {
  let handler: MeetingParticipantJoinedHandler;
  let mockMeetingRepo: jest.Mocked<MeetingBitableRepository>;
  let mockQueueService: jest.Mocked<TencentMeetingQueueService>;

  beforeEach(async () => {
    mockMeetingRepo = {
      createMeetingRecord: jest.fn(),
      searchMeetingById: jest.fn(),
      upsertMeetingRecord: jest.fn(),
    } as unknown as jest.Mocked<MeetingBitableRepository>;

    mockQueueService = {
      enqueueUpsertMeetingUser: jest.fn(),
      enqueueUpsertMeetingRecord: jest.fn(),
    } as unknown as jest.Mocked<TencentMeetingQueueService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingParticipantJoinedHandler,
        {
          provide: MeetingBitableRepository,
          useValue: mockMeetingRepo,
        },
        {
          provide: TencentMeetingQueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    handler = module.get<MeetingParticipantJoinedHandler>(
      MeetingParticipantJoinedHandler,
    );
  });

  describe('supports', () => {
    it('should support meeting.participant-joined event', () => {
      expect(handler.supports('meeting.participant-joined')).toBe(true);
    });

    it('should not support other events', () => {
      expect(handler.supports('meeting.started')).toBe(false);
      expect(handler.supports('meeting.ended')).toBe(false);
      expect(handler.supports('meeting.recording-completed')).toBe(false);
    });
  });

  describe('handle', () => {
    const mockPayload: TencentEventPayload = {
      operate_time: Date.now(),
      meeting_info: {
        meeting_id: 'test-meeting-id',
        sub_meeting_id: 'test-sub-meeting-id',
        meeting_code: '123456789',
        subject: 'Test Meeting',
        start_time: 1234567890,
        end_time: 1234567900,
        creator: {
          userid: 'creator-id',
          uuid: 'creator-uuid',
          user_name: 'Creator',
        },
        meeting_type: 0,
      },
      operator: {
        uuid: 'test-user-id',
        userid: 'test-user-id',
        user_name: 'Test User',
        instance_id: '1',
      },
    } as TencentEventPayload;

    it('should handle participant joined event successfully', async () => {
      // Mock upserting meeting
      mockMeetingRepo.upsertMeetingRecord.mockResolvedValue({
        code: 0,
        msg: 'success',
        data: {
          record: {
            record_id: 'meeting-record-123',
            fields: {},
            created_by: { id: 'test' },
            created_time: Date.now(),
            last_modified_by: { id: 'test' },
            last_modified_time: Date.now(),
          },
        },
      });

      await handler.handle(mockPayload, 0);

      // Verify queue service was called
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockQueueService.enqueueUpsertMeetingUser).toHaveBeenCalledWith({
        uuid: 'test-user-id',
        userid: 'test-user-id',
        user_name: 'Test User',
        is_enterprise_user: true,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMeetingRepo.upsertMeetingRecord).toHaveBeenCalledWith({
        platform: '腾讯会议',
        subject: 'Test Meeting',
        meeting_id: 'test-meeting-id',
        sub_meeting_id: 'test-sub-meeting-id',
        meeting_code: '123456789',
        start_time: 1234567890000,
        end_time: 1234567900000,
      });
    });

    it('should handle meeting upsert with participant', async () => {
      // Mock upserting meeting
      mockMeetingRepo.upsertMeetingRecord.mockResolvedValue({
        code: 0,
        msg: 'success',
        data: {
          record: {
            record_id: 'meeting-record-123',
            fields: {},
            created_by: { id: 'test' },
            created_time: Date.now(),
            last_modified_by: { id: 'test' },
            last_modified_time: Date.now(),
          },
        },
      });

      await handler.handle(mockPayload, 0);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMeetingRepo.upsertMeetingRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: '腾讯会议',
          subject: 'Test Meeting',
          meeting_id: 'test-meeting-id',
          sub_meeting_id: 'test-sub-meeting-id',
          meeting_code: '123456789',
          start_time: 1234567890000,
          end_time: 1234567900000,
        }),
      );
    });

    it('should handle missing meeting_info', async () => {
      const invalidPayload = {
        ...mockPayload,
        meeting_info: undefined,
      } as unknown as TencentEventPayload;

      await expect(handler.handle(invalidPayload, 0)).rejects.toThrow(
        'Invalid payload: missing meeting_info',
      );
    });

    it('should handle missing operator', async () => {
      const invalidPayload = {
        ...mockPayload,
        operator: undefined,
      } as unknown as TencentEventPayload;

      await expect(handler.handle(invalidPayload, 0)).rejects.toThrow(
        'Invalid payload: missing operator',
      );
    });
  });
});
