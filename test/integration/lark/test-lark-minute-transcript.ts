// Node SDK 使用说明：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/server-side-sdk/preparation-before-development
// 飞书导出妙记文字记录接口文档：https://open.feishu.cn/document/minutes-v1/minute-transcript/get?appId=cli_a8481aa2befd901c

import * as fs from 'fs';
import * as path from 'path';
import * as lark from '@larksuiteoapi/node-sdk';

// Step 1: 创建客户端
const client = new lark.Client({
  appId: 'cli_a8481aa2befd901c', // 替换为你的 App ID
  appSecret: 'Jx47tRCaTY2S2chIe1XBbgldPxuIhIiz', // 替换为你的 App Secret
  disableTokenCache: false, // SDK 自动管理 tenant token
});

// Step 2: 异步函数导出妙记文字记录
async function exportMinuteTranscript() {
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

    const res = await client.minutes.v1.minuteTranscript.get({
      path: { minute_token: minuteToken },
      params: {
        need_speaker: true,
        need_timestamp: true,
        file_format: fileFormat,
      },
    });

    // 保存文件
    await res.writeFile(filePath);

    console.log(`妙记文字记录已保存到: ${filePath}`);
  } catch (e: any) {
    console.error(
      '导出妙记文字记录失败：',
      JSON.stringify(e.response?.data || e, null, 4),
    );
  }
}

// Step 3: 执行函数
exportMinuteTranscript();
