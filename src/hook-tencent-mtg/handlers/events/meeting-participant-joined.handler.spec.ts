import { Test, TestingModule } from '@nestjs/testing';
import { MeetingParticipantJoinedHandler } from './meeting-participant-joined.handler';
import { MeetingUserBitableRepository } from '../../../integrations/lark/repositories/meeting-user.repository';
import { MeetingBitableRepository } from '../../../integrations/lark/repositories/meeting.repository';

describe('MeetingParticipantJoinedHandler', () => {
  let handler: MeetingParticipantJoinedHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingParticipantJoinedHandler,
        {
          provide: MeetingBitableRepository,
          useValue: {
            upsertMeetingRecord: jest.fn(),
          },
        },
        {
          provide: MeetingUserBitableRepository,
          useValue: {
            upsertMeetingUserRecord: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<MeetingParticipantJoinedHandler>(
      MeetingParticipantJoinedHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should support meeting.participant-joined event', () => {
    expect(handler.supports('meeting.participant-joined')).toBe(true);
    expect(handler.supports('meeting.start')).toBe(false);
  });
});
