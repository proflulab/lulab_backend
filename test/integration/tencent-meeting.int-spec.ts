import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TencentMeetingService } from '@/tencent-meeting/services/tencent-meeting.service';
import { TencentApiService } from '@/integrations/tencent-meeting/tencent-api.service';
import {
  RecordMeetingsResponse,
  MeetingDetailResponse,
  PlatformApiException
} from '@/integrations/tencent-meeting';
import { config } from 'dotenv';

// 使用测试环境变量
config({ path: '.env.test' });

type TencentApiMock = jest.Mocked<
  Pick<
    TencentApiService,
    | 'getCorpRecords'
    | 'getMeetingDetail'
    | 'getRecordingFileDetail'
    | 'getMeetingParticipants'
  >
>;

describe('Tencent Meeting Integration (mocked API)', () => {
  let moduleRef: TestingModule;
  let meetingService: TencentMeetingService;
  let configService: ConfigService;

  const mockTencentApi: TencentApiMock = {
    getCorpRecords: jest.fn(),
    getMeetingDetail: jest.fn(),
    getRecordingFileDetail: jest.fn(),
    getMeetingParticipants: jest.fn(),
  } as unknown as TencentApiMock;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        ConfigService,
        TencentMeetingService,
        { provide: TencentApiService, useValue: mockTencentApi },
      ],
    }).compile();

    meetingService = moduleRef.get(TencentMeetingService);
    configService = moduleRef.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getCorpRecords forwards params and returns data', async () => {
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;

    const fakeResponse: RecordMeetingsResponse = {
      total_count: 1,
      current_size: 1,
      current_page: 1,
      total_page: 1,
      record_meetings: [
        {
          meeting_record_id: 'rec-1',
          meeting_id: 'm-1',
          meeting_code: 'code-1',
          userid: 'u-1',
          media_start_time: now - 1000,
          subject: 'test subject',
          state: 1,
          record_files: [],
        },
      ],
    };

    mockTencentApi.getCorpRecords.mockResolvedValueOnce(fakeResponse);

    const result = await meetingService.getCorpRecords(
      oneHourAgo,
      now,
      10,
      2,
      'op-1',
      1,
    );

    expect(mockTencentApi.getCorpRecords).toHaveBeenCalledWith(
      oneHourAgo,
      now,
      10,
      2,
      'op-1',
      1,
    );
    expect(result).toEqual(fakeResponse);
  });

  it('wraps API errors as PlatformApiException', async () => {
    mockTencentApi.getCorpRecords.mockRejectedValueOnce(
      new Error('downstream error'),
    );

    const now = Math.floor(Date.now() / 1000);
    await expect(
      meetingService.getCorpRecords(now - 60, now),
    ).rejects.toBeInstanceOf(PlatformApiException);

    await expect(meetingService.getCorpRecords(now - 60, now)).rejects.toThrow(
      /TENCENT_MEETING API调用失败 \[getCorpRecords\]/,
    );
  });

  it('getMeetingDetail passes through data', async () => {
    const detail: MeetingDetailResponse = {
      meeting_id: 'm-1',
      meeting_code: 'code-1',
      subject: 'subj',
      start_time: '1',
      end_time: '2',
      creator: { userid: 'u1', user_name: 'User 1' },
      meeting_type: 0,
    };
    mockTencentApi.getMeetingDetail.mockResolvedValueOnce(detail);

    const res = await meetingService.getMeetingDetail('m-1', 'u1', '1');
    expect(mockTencentApi.getMeetingDetail).toHaveBeenCalledWith(
      'm-1',
      'u1',
      '1',
    );
    expect(res).toEqual(detail);
  });

  it('getConfigStatus reflects missing keys from .env.test', () => {
    const status = meetingService.getConfigStatus();
    // .env.test 中未提供 TOKEN 和 ENCODING_AES_KEY
    expect(status.configured).toBe(false);
    expect(status.missingConfigs).toEqual(
      expect.arrayContaining([
        'TENCENT_MEETING_TOKEN',
        'TENCENT_MEETING_ENCODING_AES_KEY',
      ]),
    );

    // 部分可用配置应当存在（来自 .env.test）
    expect(status.availableConfigs).toEqual(
      expect.arrayContaining([
        'TENCENT_MEETING_SECRET_ID',
        'TENCENT_MEETING_SECRET_KEY',
        'TENCENT_MEETING_APP_ID',
        'TENCENT_MEETING_SDK_ID',
      ]),
    );

    // ConfigService 能读取 USER_ID
    expect(configService.get('USER_ID')).toBeDefined();
  });
});

describe('TencentApiService parameter validation', () => {
  let apiModule: TestingModule;
  let apiService: TencentApiService;

  beforeAll(async () => {
    apiModule = await Test.createTestingModule({
      providers: [ConfigService, TencentApiService],
    }).compile();
    apiService = apiModule.get(TencentApiService);
  });

  it('throws when time range exceeds 31 days', async () => {
    const now = Math.floor(Date.now() / 1000);
    const tooFarBack = now - 32 * 24 * 60 * 60; // 32天前
    await expect(apiService.getCorpRecords(tooFarBack, now)).rejects.toThrow(
      '时间区间不允许超过31天',
    );
  });
});
