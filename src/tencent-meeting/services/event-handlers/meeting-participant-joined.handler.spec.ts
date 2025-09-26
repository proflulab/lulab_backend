import { Test, TestingModule } from '@nestjs/testing';
import { MeetingParticipantJoinedHandler } from './meeting-participant-joined.handler';
import { MeetingUserBitableRepository } from '../../../integrations/lark/repositories/meeting-user.repository';
import { MeetingBitableRepository } from '../../../integrations/lark/repositories/meeting.repository';
import { TencentEventPayload } from '../../types/tencent-webhook-events.types';

describe('MeetingParticipantJoinedHandler', () => {
  let handler: MeetingParticipantJoinedHandler;
  let mockMeetingUserRepo: jest.Mocked<MeetingUserBitableRepository>;
  let mockMeetingRepo: jest.Mocked<MeetingBitableRepository>;

  beforeEach(async () => {
    mockMeetingUserRepo = {
      createMeetingUserRecord: jest.fn(),
      upsertMeetingUserRecord: jest.fn(),
      searchMeetingUserByUserid: jest.fn(),
      searchMeetingUserByuser_name: jest.fn(),
    } as any;

    mockMeetingRepo = {
      searchMeetingById: jest.fn(),
      upsertMeetingRecord: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingParticipantJoinedHandler,
        {
          provide: MeetingUserBitableRepository,
          useValue: mockMeetingUserRepo,
        },
        {
          provide: MeetingBitableRepository,
          useValue: mockMeetingRepo,
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
    } as any;

    it('should handle participant joined event successfully', async () => {
      // Mock creating new user
      const userRecordId = 'user-record-123';
      mockMeetingUserRepo.upsertMeetingUserRecord.mockResolvedValue({
        code: 0,
        msg: 'success',
        data: { record: { record_id: userRecordId } },
      } as any);

      // Mock upserting meeting
      mockMeetingRepo.upsertMeetingRecord.mockResolvedValue({
        code: 0,
        msg: 'success',
        data: { record: { record_id: 'meeting-record-123' } },
      } as any);

      await handler.handle(mockPayload, 0);

      expect(mockMeetingUserRepo.upsertMeetingUserRecord).toHaveBeenCalledWith({
        uuid: 'test-user-id',
        userid: 'test-user-id',
        user_name: 'Test User',
        is_enterprise_user: true,
      });
      expect(mockMeetingRepo.upsertMeetingRecord).toHaveBeenCalledWith({
        platform: '腾讯会议',
        subject: 'Test Meeting',
        meeting_id: 'test-meeting-id',
        sub_meeting_id: 'test-sub-meeting-id',
        meeting_code: '123456789',
        start_time: 1234567890000,
        end_time: 1234567900000,
        participants: [userRecordId],
      });
    });

    it('should handle meeting upsert with participant', async () => {
      // Mock creating new user
      const userRecordId = 'user-record-123';
      mockMeetingUserRepo.upsertMeetingUserRecord.mockResolvedValue({
        code: 0,
        msg: 'success',
        data: { record: { record_id: userRecordId } },
      } as any);

      // Mock upserting meeting
      mockMeetingRepo.upsertMeetingRecord.mockResolvedValue({
        code: 0,
        msg: 'success',
        data: { record: { record_id: 'meeting-record-123' } },
      } as any);

      await handler.handle(mockPayload, 0);

      expect(mockMeetingRepo.upsertMeetingRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          participants: [userRecordId],
        }),
      );
    });

    it('should handle existing user', async () => {
      const existingUser = {
        record_id: 'existing-record-id',
        fields: {
          uuid: 'test-user-id',
          userid: 'test-user-id',
          user_name: 'Test User',
          is_enterprise_user: true,
        },
      };

      // Mock the existing user
      mockMeetingUserRepo.searchMeetingUserByUserid.mockResolvedValue([
        existingUser,
      ]);

      // Mock upsert user record response
      mockMeetingUserRepo.upsertMeetingUserRecord.mockResolvedValue({
        code: 0,
        msg: 'success',
        data: { record: { record_id: 'existing-record-id' } },
      } as any);

      // Mock upserting meeting
      mockMeetingRepo.upsertMeetingRecord.mockResolvedValue({
        code: 0,
        msg: 'success',
        data: { record: { record_id: 'meeting-record-123' } },
      } as any);

      await handler.handle(mockPayload, 0);

      // 即使存在用户，也会调用upsert更新记录
      expect(mockMeetingUserRepo.upsertMeetingUserRecord).toHaveBeenCalledWith({
        uuid: 'test-user-id',
        userid: 'test-user-id',
        user_name: 'Test User',
        is_enterprise_user: true,
      });

      // 验证会议记录包含参与者
      expect(mockMeetingRepo.upsertMeetingRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          participants: ['existing-record-id'],
        }),
      );
    });

    it('should handle missing meeting_info', async () => {
      const invalidPayload = { ...mockPayload, meeting_info: undefined as any };

      await expect(handler.handle(invalidPayload, 0)).rejects.toThrow(
        'Invalid payload: missing meeting_info',
      );
    });

    it('should handle missing operator', async () => {
      const invalidPayload = { ...mockPayload, operator: undefined as any };

      await expect(handler.handle(invalidPayload, 0)).rejects.toThrow(
        'Invalid payload: missing operator',
      );
    });
  });
});
