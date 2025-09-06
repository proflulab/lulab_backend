import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TencentEventHandlerService } from '../../src/tencent-meeting/services/tencent-event-handler.service';
import { MeetingBitableRepository } from '../../libs/integrations-lark/repositories/meeting-bitable.repository';
import { TencentMeetingEvent } from '../../src/tencent-meeting/types/tencent-events.types';

// Mock services
const mockConfigService = {
  get: jest.fn(),
};

const mockMeetingBitableRepository = {
  createMeetingRecord: jest.fn(),
};

describe('Lark Integration', () => {
  let service: TencentEventHandlerService;
  let configService: ConfigService;
  let meetingBitableRepository: MeetingBitableRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TencentEventHandlerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MeetingBitableRepository,
          useValue: mockMeetingBitableRepository,
        },
      ],
    }).compile();

    service = module.get<TencentEventHandlerService>(TencentEventHandlerService);
    configService = module.get<ConfigService>(ConfigService);
    meetingBitableRepository = module.get<MeetingBitableRepository>(MeetingBitableRepository);

    jest.clearAllMocks();
  });

  describe('腾讯会议事件处理与飞书集成', () => {
    it('应该在会议开始时创建飞书多维表格记录', async () => {
      // 模拟配置存在
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'LARK_BITABLE_APP_TOKEN') return 'test_app_token';
        if (key === 'LARK_BITABLE_MEETING_TABLE_ID') return 'test_table_id';
        return null;
      });

      // 模拟创建记录成功
      mockMeetingBitableRepository.createMeetingRecord.mockResolvedValue({
        data: { record: { record_id: 'test_record_id' } },
      });

      const mockEvent: TencentMeetingEvent = {
        event: 'meeting.started',
        trace_id: 'test_trace_id',
        payload: [
          {
            operate_time: Date.now(),
            operator: {
              userid: 'test_user',
              uuid: 'test_uuid',
              user_name: '测试用户',
              instance_id: 'test_instance',
            },
            meeting_info: {
              meeting_id: 'test_meeting_id',
              meeting_code: '123456789',
              subject: '测试会议',
              creator: {
                userid: 'creator_user',
                uuid: 'creator_uuid',
                user_name: '会议创建者',
              },
              meeting_type: 0,
              start_time: Math.floor(Date.now() / 1000),
              end_time: Math.floor(Date.now() / 1000) + 3600, // 1小时
            },
          },
        ],
      };

      await service.handleEvent(mockEvent);

      expect(mockMeetingBitableRepository.createMeetingRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'tencent',
          subject: '测试会议',
          meeting_id: 'test_meeting_id',
          start_time: expect.any(Number),
          end_time: expect.any(Number),
          creator: ['会议创建者'],
          operator: ['会议创建者']
        })
      );
    });

    it('应该在配置缺失时跳过创建记录', async () => {
      // 模拟配置缺失
      mockConfigService.get.mockReturnValue(null);

      const mockEvent: TencentMeetingEvent = {
        event: 'meeting.started',
        trace_id: 'test_trace_id',
        payload: [
          {
            operate_time: Date.now(),
            operator: {
              userid: 'test_user',
              uuid: 'test_uuid',
              user_name: '测试用户',
              instance_id: 'test_instance',
            },
            meeting_info: {
              meeting_id: 'test_meeting_id',
              meeting_code: '123456789',
              subject: '测试会议',
              creator: {
                userid: 'creator_user',
                uuid: 'creator_uuid',
                user_name: '会议创建者',
              },
              meeting_type: 0,
              start_time: Math.floor(Date.now() / 1000),
              end_time: Math.floor(Date.now() / 1000) + 3600,
            },
          },
        ],
      };

      await service.handleEvent(mockEvent);

      expect(mockMeetingBitableRepository.createMeetingRecord).not.toHaveBeenCalled();
    });

    it('应该在创建记录失败时不影响主流程', async () => {
      // 模拟配置存在
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'LARK_BITABLE_APP_TOKEN') return 'test_app_token';
        if (key === 'LARK_BITABLE_MEETING_TABLE_ID') return 'test_table_id';
        return null;
      });

      // 模拟创建记录失败
      mockMeetingBitableRepository.createMeetingRecord.mockRejectedValue(new Error('API错误'));

      const mockEvent: TencentMeetingEvent = {
        event: 'meeting.started',
        trace_id: 'test_trace_id',
        payload: [
          {
            operate_time: Date.now(),
            operator: {
              userid: 'test_user',
              uuid: 'test_uuid',
              user_name: '测试用户',
              instance_id: 'test_instance',
            },
            meeting_info: {
              meeting_id: 'test_meeting_id',
              meeting_code: '123456789',
              subject: '测试会议',
              creator: {
                userid: 'creator_user',
                uuid: 'creator_uuid',
                user_name: '会议创建者',
              },
              meeting_type: 0,
              start_time: Math.floor(Date.now() / 1000),
              end_time: Math.floor(Date.now() / 1000) + 3600,
            },
          },
        ],
      };

      // 不应该抛出错误
      await expect(service.handleEvent(mockEvent)).resolves.not.toThrow();
      expect(mockMeetingBitableRepository.createMeetingRecord).toHaveBeenCalled();
    });
  });
});