// Node SDK 使用说明：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/server-side-sdk/preparation-before-development
// 飞书导出妙记文字记录接口文档：https://open.feishu.cn/document/minutes-v1/minute-transcript/get?appId=cli_a8481aa2befd901c

import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { LarkClient } from '../../../src/integrations/lark/lark.client';
import { RecordingFileBitableRepository } from '../../../src/integrations/lark/repositories/meeting-recording-file.repository';
import { RecordingFileData } from '@/integrations/lark/types';
import { BitableService } from '../../../src/integrations/lark/services/bitable.service';

// 类型守卫与安全日志
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const hasResponseData = (v: unknown): v is { response: { data?: unknown } } =>
  isRecord(v) &&
  'response' in v &&
  isRecord((v as { response?: unknown }).response);

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

async function bootstrap() {
  // 配置对象符合 LarkConfig 形状
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
        numberRecord: '',
      },
    },
    event: {
      encryptKey: '',
      verificationToken: '',
    },
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      {
        provide: LarkClient,
        useFactory: () => new LarkClient(cfg),
      },
    ],
  }).compile();

  const client = moduleRef.get<LarkClient>(LarkClient);

  // 初始化 BitableService 和 RecordingFileRepository
  const bitableService = new BitableService(client);
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

    for await (const chunk of stream as AsyncIterable<unknown>) {
      let text: string;
      if (typeof chunk === 'string') {
        text = chunk;
      } else if (chunk instanceof Uint8Array || Buffer.isBuffer(chunk)) {
        text = Buffer.from(chunk).toString('utf8');
      } else {
        text = String(chunk);
      }
      fileContent += text;
      writeStream.write(text);
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
  } catch (e: unknown) {
    const payload = hasResponseData(e) ? e.response.data : e;
    console.error(`导出妙记文字记录失败：${safeStringify(payload)}`);
  }
}

void bootstrap();
