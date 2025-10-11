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
        // 将事件数据转换为 JSON 字符串
        const jsonStr = JSON.stringify(data, null, 2);
        console.log('收到会议结束事件 JSON 字符串：\n', jsonStr);

        // 如果其他逻辑需要获取 JSON 对象，可以直接用 data 对象
        // const meetingId = data.meeting.id;
        // const topic = data.meeting.topic;
        // const operatorId = data.operator.id.user_id;
        // ...其他逻辑处理
      } catch (error) {
        console.error('处理会议结束事件出错：', error);
      }
    },
  }),
});

// 注意：官方 SDK 不提供直接访问底层 WebSocket 的方法，因此无法直接监听 open/error/close。
// 上述代码可以直接生成 JSON 字符串，并且 data 对象仍然可供其他逻辑调用。
