// Node SDK 使用说明：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/server-side-sdk/preparation-before-development
// 飞书导出妙记文字记录接口文档：https://open.feishu.cn/document/minutes-v1/minute-transcript/get?appId=cli_a8481aa2befd901c

import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LarkClient } from '../../../src/integrations/lark/lark.client';
import { RecordingFileBitableRepository } from '../../../src/integrations/lark/repositories/meeting-recording-file.repository';
import { RecordingFileData } from '@/integrations/lark/types';
import { BitableService } from '../../../src/integrations/lark/services/bitable.service';
import { Readable } from 'stream';

async function bootstrap() {
  const configService = new ConfigService({
    LARK_APP_ID: 'cli_a8481aa2befd901c',
    LARK_APP_SECRET: 'Jx47tRCaTY2S2chIe1XBbgldPxuIhIiz',
  });

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      {
        provide: LarkClient,
        useFactory: () =>
          new LarkClient(configService, {
            appId: 'cli_a8481aa2befd901c',
            appSecret: 'Jx47tRCaTY2S2chIe1XBbgldPxuIhIiz',
            logLevel: 'info' as const,
            baseUrl: 'https://open.feishu.cn',
            bitable: {
              appToken: 'O6CPbzuVza3X4ysfwJacDyabnJe',
              tableIds: {
                meeting: '',
                meetingUser: '',
                recordingFile: 'tblJbqecW2952dVW',
              },
            },
          }),
      },
    ],
  }).compile();

  const client = moduleRef.get<LarkClient>(LarkClient);

  // 初始化 BitableService 和 RecordingFileRepository
  const cfg = {
    appId: 'cli_a8481aa2befd901c',
    appSecret: 'Jx47tRCaTY2S2chIe1XBbgldPxuIhIiz',
    logLevel: 'info' as const,
    baseUrl: 'https://open.feishu.cn',
    bitable: {
      appToken: 'O6CPbzuVza3X4ysfwJacDyabnJe',
      tableIds: {
        meeting: '',
        meetingUser: '',
        recordingFile: 'tblJbqecW2952dVW',
      },
    },
  };

  const bitableService = new BitableService(client as any);
  const recordingFileRepository = new RecordingFileBitableRepository(
    bitableService,
    cfg,
  );

  try {
    // const minuteToken = 'obcn1beegjag9om1a2gg3dtg'; // 替换为实际 minute_token
    const minuteToken = 'obcn92y6893ubg7r2g32l1bc'; // 替换为实际 minute_token
    const fileFormat = 'txt'; // 可以选择 'txt' 或 'srt'
    const extMap: Record<string, string> = {
      txt: 'txt',
      srt: 'srt',
    };
    const ext = extMap[fileFormat] || 'txt';
    const fileName = `minute_transcript.${ext}`;
    const filePath = path.join(__dirname, fileName);

    const sdkClient = client.getClient();
    const res = await sdkClient.minutes.v1.minuteTranscript.get({
      path: { minute_token: minuteToken },
      params: {
        need_speaker: true,
        need_timestamp: true,
        file_format: fileFormat,
      },
    });

    // 使用 getReadableStream() 读取文件内容，同时写入文件和缓存内容
    const stream = res.getReadableStream();
    const writeStream = fs.createWriteStream(filePath);
    let fileContent = '';

    for await (const chunk of stream) {
      fileContent += chunk.toString();
      writeStream.write(chunk);
    }
    writeStream.end();

    const recordingData: RecordingFileData = {
      record_file_id: minuteToken,
      ai_meeting_transcripts: fileContent,
      meet: [],
    };

    // 写入 Bitable
    const createResult =
      await recordingFileRepository.createRecordingFileRecord(recordingData);
    console.log('写入 Bitable 成功:', createResult);

    console.log(`妙记文字记录已保存到: ${filePath}`);
  } catch (e: any) {
    console.error(
      '导出妙记文字记录失败：',
      JSON.stringify(e.response?.data || e, null, 4),
    );
  }
}

bootstrap();
