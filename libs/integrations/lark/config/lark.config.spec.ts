import { larkConfig } from './lark.config';

describe('larkConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('maps environment variables to config fields', () => {
    process.env.LARK_APP_ID = 'app_id_123';
    process.env.LARK_APP_SECRET = 'secret_456';
    process.env.LARK_LOG_LEVEL = 'debug';
    process.env.LARK_BASE_URL = 'https://example.larksuite.com';
    process.env.LARK_BITABLE_APP_TOKEN = 'app_token_abc';
    process.env.LARK_TABLE_MEETING = 'tbl_meeting';
    process.env.LARK_TABLE_MEETING_USER = 'tbl_user';
    process.env.LARK_TABLE_MEETING_RECORD_FILE = 'tbl_recording';

    const cfg = larkConfig();

    expect(cfg.appId).toBe('app_id_123');
    expect(cfg.appSecret).toBe('secret_456');
    expect(cfg.logLevel).toBe('debug');
    expect(cfg.baseUrl).toBe('https://example.larksuite.com');

    expect(cfg.bitable.appToken).toBe('app_token_abc');
    expect(cfg.bitable.tableIds.meeting).toBe('tbl_meeting');
    expect(cfg.bitable.tableIds.meetingUser).toBe('tbl_user');
    expect(cfg.bitable.tableIds.recordingFile).toBe('tbl_recording');
  });

  it('applies sensible defaults when env vars are missing', () => {
    delete process.env.LARK_APP_ID;
    delete process.env.LARK_APP_SECRET;
    delete process.env.LARK_LOG_LEVEL;
    delete process.env.LARK_BASE_URL;
    delete process.env.LARK_BITABLE_APP_TOKEN;
    delete process.env.LARK_TABLE_MEETING;
    delete process.env.LARK_TABLE_MEETING_USER;
    delete process.env.LARK_TABLE_MEETING_RECORD_FILE;

    const cfg = larkConfig();

    expect(cfg.appId).toBe('');
    expect(cfg.appSecret).toBe('');
    expect(cfg.logLevel).toBe('info');
    expect(cfg.baseUrl).toBe('https://open.larksuite.com');

    expect(cfg.bitable.appToken).toBe('');
    expect(cfg.bitable.tableIds.meeting).toBe('');
    expect(cfg.bitable.tableIds.meetingUser).toBe('');
    expect(cfg.bitable.tableIds.recordingFile).toBe('');
  });
});
