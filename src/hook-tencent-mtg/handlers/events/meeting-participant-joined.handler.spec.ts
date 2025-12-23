/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-23 04:23:42
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-24 05:01:01
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/events/meeting-participant-joined.handler.spec.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MeetingParticipantJoinedHandler } from './meeting-participant-joined.handler';
import { MeetingBitableService } from '../../services/meeting-bitable.service';
import { MeetingDatabaseService } from '../../services/meeting-database.service';
import { TencentEventPayload } from '../../types/tencent-event.types';

describe('MeetingParticipantJoinedHandler', () => {
  let handler: MeetingParticipantJoinedHandler;
  let meetingRecordService: jest.Mocked<MeetingBitableService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingParticipantJoinedHandler,
        {
          provide: MeetingBitableService,
          useValue: {
            updateMeetingParticipants: jest
              .fn()
              .mockImplementation(function (this: void) {}),
            upsertMeetingUserRecord: jest
              .fn()
              .mockImplementation(function (this: void) {}),
          },
        },
        {
          provide: MeetingDatabaseService,
          useValue: {
            upsertPlatformUser: jest
              .fn()
              .mockImplementation(function (this: void) {}),
          },
        },
      ],
    }).compile();

    handler = module.get<MeetingParticipantJoinedHandler>(
      MeetingParticipantJoinedHandler,
    );
    meetingRecordService = module.get(MeetingBitableService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should support meeting.participant-joined event', () => {
    expect(handler.supports('meeting.participant-joined')).toBe(true);
    expect(handler.supports('meeting.start')).toBe(false);
  });

  it('should handle meeting participant joined event', async () => {
    const payload: TencentEventPayload = {
      operate_time: Date.now(),
      operator: {
        userid: 'operator123',
        uuid: 'operator-uuid',
        user_name: 'Test Operator',
        instance_id: '1',
      },
      meeting_info: {
        meeting_id: 'meeting123',
        sub_meeting_id: 'sub123',
        meeting_code: '123456',
        subject: 'Test Meeting',
        start_time: Date.now() / 1000,
        end_time: Date.now() / 1000 + 3600,
        meeting_type: 0,
        creator: {
          userid: 'creator123',
          uuid: 'creator-uuid',
          user_name: 'Test Creator',
        },
      },
    };

    meetingRecordService.upsertMeetingUserRecord.mockResolvedValue('record-id');
    meetingRecordService.updateMeetingParticipants.mockResolvedValue();

    await handler.handle(payload, 1);

    expect(meetingRecordService.upsertMeetingUserRecord).toHaveBeenCalledTimes(
      2,
    );

    expect(meetingRecordService.upsertMeetingUserRecord).toHaveBeenCalledWith(
      payload.operator,
    );

    expect(meetingRecordService.upsertMeetingUserRecord).toHaveBeenCalledWith(
      payload.meeting_info.creator,
    );

    expect(
      meetingRecordService.updateMeetingParticipants,
    ).toHaveBeenCalledTimes(1);

    expect(meetingRecordService.updateMeetingParticipants).toHaveBeenCalledWith(
      payload.meeting_info,
      payload.operator,
    );
  });

  it('should handle errors gracefully', async () => {
    const payload: TencentEventPayload = {
      operate_time: Date.now(),
      operator: {
        userid: 'operator123',
        uuid: 'operator-uuid',
        user_name: 'Test Operator',
        instance_id: '1',
      },
      meeting_info: {
        meeting_id: 'meeting123',
        sub_meeting_id: 'sub123',
        meeting_code: '123456',
        subject: 'Test Meeting',
        start_time: Date.now() / 1000,
        end_time: Date.now() / 1000 + 3600,
        meeting_type: 0,
        creator: {
          userid: 'creator123',
          uuid: 'creator-uuid',
          user_name: 'Test Creator',
        },
      },
    };

    meetingRecordService.upsertMeetingUserRecord.mockRejectedValue(
      new Error('Service error'),
    );

    // Should not throw error due to Promise.allSettled
    await expect(handler.handle(payload, 1)).resolves.not.toThrow();
  });
});
