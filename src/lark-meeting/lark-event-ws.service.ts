import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Lark from '@larksuiteoapi/node-sdk';
import { LarkMeetingRecordingService } from './lark-meeting-recording.service';
import { MinuteTranscriptService } from './lark-minute-transript.service';
import { LarkMeetingDetailService } from './lark-meeting-detail.service';
import { LarkMeetingWriterService } from './lark-meeting-writer.service';

interface MeetingEndedEvent {
  event: {
    meeting_id: string;
  };
}

@Injectable()
export class LarkEventWsService implements OnModuleInit {
  private wsClient: Lark.WSClient;
  private processingMinuteTokens = new Set<string>();
  // 临时缓存：按会议ID保存最近一次会议元数据（topic/meeting_no/start_time/end_time）
  private lastMeetingMetaById = new Map<
    string,
    {
      topic?: string;
      meetingNo?: string | number;
      startTime?: string | number;
      endTime?: string | number;
    }
  >();
  // 临时缓存：按会议ID保存会议详情字段
  private lastMeetingDetailById = new Map<
    string,
    {
      meeting_end_time?: string | number;
      meeting_id?: string;
      meeting_instance_id?: string;
      meeting_start_time?: string | number;
      organizer?: any;
      user_id?: string;
    }
  >();

  constructor(
    private readonly larkMeetingRecordingService: LarkMeetingRecordingService,
    private readonly minuteTranscriptService: MinuteTranscriptService,
    private readonly larkMeetingDetailService: LarkMeetingDetailService,
    private readonly larkMeetingWriterService: LarkMeetingWriterService,
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

          // 解析并临时存储会议元数据
          const topic =
            plainData?.meeting?.topic ??
            plainData?.event?.meeting?.topic ??
            plainData?.event?.topic;
          const meetingNo =
            plainData?.meeting?.meeting_no ??
            plainData?.event?.meeting_no ??
            plainData?.event?.meeting?.meeting_no;
          const startTime =
            plainData?.meeting?.start_time ??
            plainData?.event?.meeting?.start_time ??
            plainData?.event?.start_time;
          const endTime =
            plainData?.meeting?.end_time ??
            plainData?.event?.meeting?.end_time ??
            plainData?.event?.end_time;

          this.lastMeetingMetaById.set(meetingId, {
            topic,
            meetingNo,
            startTime,
            endTime,
          });
          console.log('已缓存会议元数据：', {
            meetingId,
            topic,
            meetingNo,
            startTime,
            endTime,
          });

          // 使用 start_time / end_time 调用会议明细查询，尝试获取并缓存更多字段
          try {
            const queryStart = startTime ?? Math.floor(Date.now() / 1000);
            const queryEnd = endTime ?? Math.floor(Date.now() / 1000);
            console.log('查询会议列表参数：', { start_time: queryStart, end_time: queryEnd });
            const meetingListData = await this.larkMeetingDetailService.getMeetingList({
              start_time: queryStart,
              end_time: queryEnd,
              page_size: 50,
            });

            const items: any[] = Array.isArray(meetingListData?.items)
              ? meetingListData.items
              : Array.isArray(meetingListData?.meeting_list)
              ? meetingListData.meeting_list
              : Array.isArray(meetingListData?.list)
              ? meetingListData.list
              : [];

            console.log('会议列表返回条数：', items.length);
            if (items.length > 0) {
              const sample = items[0];
              console.log('会议列表样例字段：', {
                meeting_id: sample?.meeting_id,
                id: sample?.id,
                meeting_id_nested: sample?.meeting?.id,
                meeting_instance_id: sample?.meeting_instance_id,
                meeting_no: sample?.meeting_no ?? sample?.meeting?.meeting_no,
                start_time: sample?.meeting_start_time ?? sample?.start_time ?? sample?.meeting?.start_time,
                end_time: sample?.meeting_end_time ?? sample?.end_time ?? sample?.meeting?.end_time,
              });
            }

            const normalize = (v: any) => (v === undefined || v === null ? undefined : String(v));
            const targetIds = [
              normalize(meetingId),
              normalize(plainData?.event?.meeting_id),
              normalize(plainData?.meeting?.id),
              normalize(meetingNo),
              normalize(plainData?.meeting?.instance_id),
            ].filter(Boolean);

            const matched = items.find((it) => {
              const candidates = [
                normalize(it?.meeting_id),
                normalize(it?.id),
                normalize(it?.meeting?.id),
                normalize(it?.meeting?.meeting_id),
                normalize(it?.meeting_instance_id),
                normalize(it?.meeting_no),
                normalize(it?.meeting?.meeting_no),
              ].filter(Boolean);
              return candidates.some((cid) => targetIds.includes(cid as string));
            });

            if (matched) {
              const detail = {
                meeting_end_time:
                  matched?.meeting_end_time ?? matched?.end_time ?? matched?.meeting?.end_time,
                meeting_id:
                  matched?.meeting_id ?? matched?.id ?? meetingId,
                meeting_instance_id:
                  matched?.meeting_instance_id ?? matched?.instance_id ?? matched?.meeting?.instance_id,
                meeting_start_time:
                  matched?.meeting_start_time ?? matched?.start_time ?? matched?.meeting?.start_time,
                meeting_no: matched?.meeting_no ?? matched?.meeting?.meeting_no,
                organizer: matched?.organizer ?? matched?.meeting?.organizer,
                user_id:
                  matched?.user_id ??
                  matched?.organizer?.id?.user_id ??
                  plainData?.operator?.id?.user_id ??
                  plainData?.event?.operator?.id?.user_id,
              } as {
                meeting_end_time?: string | number;
                meeting_id?: string;
                meeting_instance_id?: string;
                meeting_start_time?: string | number;
                meeting_no?: string | number;
                organizer?: any;
                user_id?: string;
              };
              this.lastMeetingDetailById.set(meetingId, detail);
              console.log('已缓存会议详情：', { meetingId, ...detail });
            } else {
              console.log('在会议明细列表中未找到匹配会议，跳过详情缓存', {
                targetIds,
              });
            }
          } catch (e) {
            console.warn('查询会议明细失败，跳过详情缓存：', e?.message || e);
          }

          // 映射变量并写入表格（subject/meeting_code/start_time/end_time/platform）
          try {
            const meta = this.lastMeetingMetaById.get(meetingId);
            const detail = this.lastMeetingDetailById.get(meetingId);

            const subject = meta?.topic;
            const rawMeetingCode =
              (detail as any)?.meeting_no ?? meta?.meetingNo ?? detail?.meeting_id ?? meetingId;
            const meeting_code = rawMeetingCode !== undefined ? String(rawMeetingCode) : undefined;

            // 使用前面解析出的临时变量 startTime / endTime，不再读取 detail 的 meeting_* 字段
            const start_time_raw = (startTime ?? meta?.startTime) as
              | number
              | string
              | undefined;
            const end_time_raw = (endTime ?? meta?.endTime) as
              | number
              | string
              | undefined;

            // 安全解析时间为 number，仅在有效数字时返回，否则为 undefined
            const toNumberIfValid = (v: unknown): number | undefined => {
              if (typeof v === 'number') {
                return Number.isFinite(v) ? v : undefined;
              }
              if (typeof v === 'string') {
                const s = v.trim();
                if (s === '') return undefined;
                const n = Number(s);
                return Number.isFinite(n) ? n : undefined;
              }
              return undefined;
            };

            const start_time = toNumberIfValid(start_time_raw);
            const end_time = toNumberIfValid(end_time_raw);

            const platform = '飞书会议';

            // 打印写入前的入参
            console.log('准备写入会议记录到 Bitable 入参：', {
              meeting_id: meetingId,
              subject,
              meeting_code,
              start_time,
              end_time,
              platform,
            });

            await this.larkMeetingWriterService.upsertMeeting({
              platform,
              meeting_id: meetingId,
              ...(subject && { subject }),
              ...(meeting_code && { meeting_code }),
              ...(start_time !== undefined && { start_time }),
              ...(end_time !== undefined && { end_time }),
            });
            console.log('已写入会议记录到 Bitable：', {
              meeting_id: meetingId,
              subject,
              meeting_code,
              start_time,
              end_time,
              platform,
            });
          } catch (e) {
            console.warn('写入会议记录到 Bitable 失败：', e?.message || e);
          }

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
