// Node SDK 使用说明：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/server-side-sdk/nodejs-sdk/preparation-before-development
// 飞书获取会议录制文件接口文档：https://open.feishu.cn/document/server-docs/vc-v1/meeting-recording/get?appId=cli_a8481aa2befd901c

import * as lark from '@larksuiteoapi/node-sdk';

// Step 1: 创建客户端
const client = new lark.Client({
  appId: 'cli_a8481aa2befd901c',
  appSecret: 'Jx47tRCaTY2S2chIe1XBbgldPxuIhIiz',
  disableTokenCache: false,
});

// Step 2: 异步函数获取会议录制，并提取 minute_token
async function getMeetingRecording(): Promise<string | undefined> {
  try {
    const meetingId = '7552529989062230017'; // 替换为实际会议 ID

    const res = await client.vc.v1.meetingRecording.get({
      path: { meeting_id: meetingId },
    });

    if (res.code !== 0 || !res.data?.recording?.url) {
      console.error(
        '获取会议录制失败或录制 URL 不存在：',
        JSON.stringify(res, null, 4),
      );
      return;
    }

    const recording = res.data.recording;
    const url = recording?.url;
    if (!url) {
      console.error('录制 URL 不存在');
      return;
    }

    // 从 URL 提取 minute_token
    const minute_token = url.split('/').pop();

    console.log('会议录制信息：', JSON.stringify(recording, null, 4));
    console.log('minute_token：', minute_token);

    return minute_token;
  } catch (err: unknown) {
    const payload = hasResponseData(err) ? (err.response?.data ?? err) : err;
    console.error('获取会议录制失败：', JSON.stringify(payload, null, 4));
  }
}

// Step 3: 执行函数
getMeetingRecording().then((token) => {
  if (token) {
    console.log('其他逻辑可以使用 minute_token:', token);
  }
});

// 类型守卫：安全判断对象结构，避免对 any 访问成员
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const hasResponseData = (x: unknown): x is { response?: { data?: unknown } } =>
  isRecord(x) && 'response' in x;
