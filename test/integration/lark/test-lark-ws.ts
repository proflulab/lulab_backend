import * as Lark from '@larksuiteoapi/node-sdk';

// Step 1: 配置 App ID 和 App Secret
const baseConfig = {
  appId: 'cli_a8481aa2befd901c', // 替换为你的 App ID
  appSecret: 'Jx47tRCaTY2S2chIe1XBbgldPxuIhIiz', // 替换为你的 App Secret
};

// Step 2: 构建 WSClient 客户端 Build client
const wsClient = new Lark.WSClient(baseConfig);

// Step 3: 启动长连接 Establish persistent connection
wsClient.start({
  // Step 4: 注册事件 Register event
  eventDispatcher: new Lark.EventDispatcher({}).register({
    // 监听“所有会议结束事件”
    'vc.meeting.all_meeting_ended_v1': async (data) => {
      try {
        console.log('收到会议结束事件：', data);

        // 这里可以处理事件逻辑，例如写入数据库、调用其他 API 等
        // const meetingId = data?.meeting?.meeting_id;
        // const participants = data?.meeting?.participants;
        // ... 业务处理
      } catch (error) {
        console.error('处理会议结束事件出错：', error);
      }
    },
  }),
});

// 注意：官方 SDK 不提供直接访问底层 WebSocket 的方法，因此无法直接监听 open/error/close。
// 如果仅需要处理业务事件，上述代码即可正常使用 TypeScript 并监听事件。
