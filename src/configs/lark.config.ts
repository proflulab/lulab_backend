import { registerAs, ConfigType } from '@nestjs/config';

export const larkConfig = registerAs('lark', () => ({
  appId: process.env.LARK_APP_ID ?? '',
  appSecret: process.env.LARK_APP_SECRET ?? '',
  logLevel: (process.env.LARK_LOG_LEVEL ?? 'info') as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error',
  baseUrl: process.env.LARK_BASE_URL ?? 'https://open.larksuite.com',
  bitable: {
    appToken: process.env.LARK_BITABLE_APP_TOKEN ?? '',
    tableIds: {
      meeting: process.env.LARK_TABLE_MEETING ?? '',
      meetingUser: process.env.LARK_TABLE_MEETING_USER ?? '',
      recordingFile: process.env.LARK_TABLE_MEETING_RECORD_FILE ?? '',
    },
  },
}));

export type LarkConfig = ConfigType<typeof larkConfig>;
