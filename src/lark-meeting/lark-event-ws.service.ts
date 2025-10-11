import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Lark from '@larksuiteoapi/node-sdk';
import { LarkMeetingRecordingService } from './lark-meeting-recording.service';
import { MinuteTranscriptService } from './lark-minute-transript.service';

interface MeetingEndedEvent {
  event: {
    meeting_id: string;
  };
}

@Injectable()
export class LarkEventWsService implements OnModuleInit {
  private wsClient: Lark.WSClient;
  private processingMinuteTokens = new Set<string>();

  constructor(
    private readonly larkMeetingRecordingService: LarkMeetingRecordingService,
    private readonly minuteTranscriptService: MinuteTranscriptService,
  ) {}

  onModuleInit() {
    // Step 1: 配置 App ID 和 App Secret（兼容两种环境变量名，并打印 appId 便于排查）
    const appId =
      process.env.LARK_APP_ID || process.env.APP_ID || 'cli_a8481aa2befd901c';
    const appSecret =
      process.env.LARK_APP_SECRET ||
      process.env.APP_SECRET ||
      'Jx47tRCaTY2S2chIe1XBbgldPxuIhIiz';
    console.log('[Lark WS] Using appId:', appId);
    const baseConfig = { appId, appSecret };

    // Step 2: 构建 WSClient
    this.wsClient = new Lark.WSClient(baseConfig);
    console.log('[Lark WS] WSClient constructed');

    // Step 3: 构建事件分发器
    const dispatcher = new Lark.EventDispatcher({});

    // Step 4: 注册事件
    dispatcher.register({
      'vc.meeting.all_meeting_ended_v1': async (data) => {
        try {
          const plainData =
            typeof data === 'string'
              ? JSON.parse(data)
              : JSON.parse(JSON.stringify(data));
          console.log('收到会议结束事件(JSON)：', JSON.stringify(plainData));

          const meetingId =
            plainData?.meeting?.id ||
            plainData?.event?.meeting_id ||
            plainData?.event?.meeting?.id;
          if (!meetingId) {
            console.warn('会议ID未找到,跳过处理', {
              keys: Object.keys(plainData || {}),
              meeting: plainData?.meeting,
            });
            return;
          }
          console.log('解析到会议ID：', meetingId);

          const minuteToken =
            await this.larkMeetingRecordingService.getMeetingRecording(
              meetingId,
            );
          if (!minuteToken) {
            console.warn('未能获取到 minuteToken, 跳过处理');
            return;
          }
          console.log('获取到 minuteToken:', minuteToken);
          // 防重复：同一个 minuteToken 只处理一次
          if (this.processingMinuteTokens.has(minuteToken)) {
            console.warn('检测到重复的 minuteToken, 跳过处理:', minuteToken);
            return;
          }
          this.processingMinuteTokens.add(minuteToken);
          try {
            // 延时 3 分钟后再请求纪要转写
            await new Promise((resolve) => setTimeout(resolve, 3 * 60 * 1000));
            await this.minuteTranscriptService.saveTranscript(
              minuteToken,
              'txt',
            );
          } finally {
            this.processingMinuteTokens.delete(minuteToken);
          }
        } catch (error) {
          console.error('处理会议结束事件出错：', error);
        }
      },
    });

    // Step 5: 启动 WSClient 并注册事件分发器（加上 try/catch 便于定位启动失败）
    try {
      this.wsClient.start({
        eventDispatcher: dispatcher,
      });
      console.log('✅ Lark WSClient 已启动并监听事件');
    } catch (e) {
      console.error('❌ Lark WSClient 启动失败：', e);
    }
  }
}
