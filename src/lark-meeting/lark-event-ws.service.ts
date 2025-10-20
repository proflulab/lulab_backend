/**
 * LarkEventWsService（飞书 WS 事件服务）
 * 用途：
 * - 接入并监听飞书/Lark WS 事件（当前关注 vc.meeting.all_meeting_ended_v1）
 * - 解析事件数据，统一抽取会议元数据并写入缓存
 * - 调用详情查询服务补齐字段，缓存 detail
 * - 通过 writer + 仓储层实现 Bitable 幂等写入，配合缓存做一次性去重
 * - 拉取会议录制的 minute_token，并触发纪要转写（带防重复与延迟）
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Lark from '@larksuiteoapi/node-sdk';
import { LarkMeetingRecordingService } from './lark-meeting-recording.service';
import { MinuteTranscriptService } from './lark-minute-transript.service';
import { LarkMeetingDetailService } from './lark-meeting-detail.service';
import { LarkMeetingWriterService } from './lark-meeting-writer.service';
import { LarkMeetingCacheService } from './lark-meeting-cache.service';
import { parseMeetingMetaFromEvent } from './lark-meeting-normalizer';

interface MeetingEndedEvent {
  event: {
    meeting_id: string;
  };
}

// 类型辅助与安全解析
const safeJsonParse = (input: string): unknown => {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const asRecord = (v: unknown): Record<string, unknown> =>
  isObject(v) ? v : {};

const getString = (v: unknown): string | undefined => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return undefined;
};

const getNumOrStr = (v: unknown): number | string | undefined => {
  if (typeof v === 'number' || typeof v === 'string') return v;
  return undefined;
};

const safeStringify = (v: unknown): string => {
  try {
    return JSON.stringify(v);
  } catch {
    return '[Unserializable]';
  }
};

// 使用接口的类型守卫，避免未使用声明且提供更严格判断
const isMeetingEndedEventInput = (v: unknown): v is MeetingEndedEvent => {
  const obj = asRecord(v);
  const evt = asRecord(obj.event);
  return typeof evt.meeting_id === 'string';
};

@Injectable()
export class LarkEventWsService implements OnModuleInit {
  private wsClient: Lark.WSClient;
  // 缓存服务替代内部集合

  constructor(
    private readonly larkMeetingRecordingService: LarkMeetingRecordingService,
    private readonly minuteTranscriptService: MinuteTranscriptService,
    private readonly larkMeetingDetailService: LarkMeetingDetailService,
    private readonly larkMeetingWriterService: LarkMeetingWriterService,
    private readonly larkMeetingCacheService: LarkMeetingCacheService,
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
      'vc.meeting.all_meeting_ended_v1': async (data: unknown) => {
        try {
          // Step A: 解析事件入参并安全 JSON 解析
          const raw: unknown =
            typeof data === 'string' ? safeJsonParse(data) : data;
          console.log('收到会议结束事件(JSON)：', safeStringify(raw));

          const root = asRecord(raw);
          const meetingObj = asRecord(root.meeting);
          const eventObj = asRecord(root.event);
          const eventMeetingObj = asRecord(eventObj.meeting);

          // Step B: 提取会议ID（优先 root.meeting.id，其次 event.meeting_id）
          const meetingId =
            getString(meetingObj.id) ??
            (isMeetingEndedEventInput(root)
              ? getString(asRecord(root.event).meeting_id)
              : undefined) ??
            getString(eventMeetingObj.id);
          if (!meetingId) {
            console.warn('会议ID未找到,跳过处理', {
              keys: Object.keys(root),
              meeting: meetingObj,
            });
            return;
          }
          console.log('解析到会议ID：', meetingId);

          // Step C: 解析会议元数据并缓存
          // 解析并临时存储会议元数据（抽取为工具函数）
          const { topic, meetingNo, startTime, endTime } =
            parseMeetingMetaFromEvent(root);
          this.larkMeetingCacheService.setMeetingMeta(meetingId, {
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
            // Step D: 根据时间范围查询会议列表，获取更多详情字段
            const toSeconds = (v: unknown): number => {
              if (typeof v === 'number' && Number.isFinite(v)) {
                return Math.floor(v);
              }
              if (typeof v === 'string') {
                const n = Number(v);
                if (Number.isFinite(n)) return Math.floor(n);
              }
              return Math.floor(Date.now() / 1000);
            };
            const queryStart = toSeconds(startTime);
            const queryEnd = toSeconds(endTime);
            console.log('查询会议列表参数：', {
              start_time: queryStart,
              end_time: queryEnd,
            });
            const meetingListDataUnknown: unknown =
              await this.larkMeetingDetailService.getMeetingList({
                start_time: queryStart,
                end_time: queryEnd,
                page_size: 50,
              });

            const mld = asRecord(meetingListDataUnknown);
            const itemsUnknown = Array.isArray(mld.items)
              ? mld.items
              : Array.isArray(mld.meeting_list)
                ? mld.meeting_list
                : Array.isArray(mld.list)
                  ? mld.list
                  : [];
            const items = (itemsUnknown as unknown[]).map((it) => asRecord(it));

            console.log('会议列表返回条数：', items.length);
            // Step E: 打印样例字段以便排查
            if (items.length > 0) {
              const sample = items[0];
              console.log('会议列表样例字段：', {
                meeting_id: getString(sample.meeting_id),
                id: getString(sample.id),
                meeting_id_nested: getString(asRecord(sample.meeting).id),
                meeting_instance_id: getString(sample.meeting_instance_id),
                meeting_no:
                  getString(sample.meeting_no) ??
                  getString(asRecord(sample.meeting).meeting_no),
                start_time:
                  getNumOrStr(sample.meeting_start_time) ??
                  getNumOrStr(sample.start_time) ??
                  getNumOrStr(asRecord(sample.meeting).start_time),
                end_time:
                  getNumOrStr(sample.meeting_end_time) ??
                  getNumOrStr(sample.end_time) ??
                  getNumOrStr(asRecord(sample.meeting).end_time),
              });
            }

            const normalize = (v: unknown): string | undefined => {
              if (typeof v === 'string') return v;
              if (
                typeof v === 'number' ||
                typeof v === 'bigint' ||
                typeof v === 'boolean'
              ) {
                return String(v);
              }
              return undefined;
            };
            const targetIds = [
              normalize(meetingId),
              normalize(eventObj.meeting_id),
              normalize(meetingObj.id),
              normalize(meetingNo),
              normalize(meetingObj.instance_id),
            ].filter(Boolean) as string[];

            const matched = items.find((it) => {
              const itMeeting = asRecord(it.meeting);
              const candidates = [
                normalize(it.meeting_id),
                normalize(it.id),
                normalize(itMeeting.id),
                normalize(itMeeting.meeting_id),
                normalize(it.meeting_instance_id),
                normalize(it.meeting_no),
                normalize(itMeeting.meeting_no),
              ].filter(Boolean) as string[];
              return candidates.some((cid) => targetIds.includes(cid));
            });

            // Step G: 缓存匹配到的会议详情（组织者、时间等）
            if (matched) {
              const itMeeting = asRecord(matched.meeting);
              const organizer = matched.organizer ?? itMeeting.organizer;
              const detail: {
                meeting_end_time?: number | string;
                meeting_id?: string;
                meeting_instance_id?: string;
                meeting_start_time?: number | string;
                meeting_no?: number | string;
                organizer?: unknown;
                user_id?: string;
              } = {
                meeting_end_time:
                  getNumOrStr(matched.meeting_end_time) ??
                  getNumOrStr(matched.end_time) ??
                  getNumOrStr(itMeeting.end_time),
                meeting_id:
                  getString(matched.meeting_id) ??
                  getString(matched.id) ??
                  meetingId,
                meeting_instance_id:
                  getString(matched.meeting_instance_id) ??
                  getString(matched.instance_id) ??
                  getString(itMeeting.instance_id),
                meeting_start_time:
                  getNumOrStr(matched.meeting_start_time) ??
                  getNumOrStr(matched.start_time) ??
                  getNumOrStr(itMeeting.start_time),
                meeting_no:
                  getNumOrStr(matched.meeting_no) ??
                  getNumOrStr(itMeeting.meeting_no),
                organizer,
                user_id:
                  getString(
                    asRecord(asRecord(asRecord(organizer).id).user_id),
                  ) ??
                  getString(
                    asRecord(asRecord(asRecord(eventObj.operator).id).user_id),
                  ),
              };
              this.larkMeetingCacheService.setMeetingDetail(meetingId, detail);
              console.log('已缓存会议详情：', { meetingId, ...detail });
            } else {
              console.log('在会议明细列表中未找到匹配会议，跳过详情缓存', {
                targetIds,
              });
            }
          } catch (e) {
            const errMsg =
              e instanceof Error
                ? e.message
                : typeof e === 'object' &&
                    e !== null &&
                    'message' in e &&
                    typeof (e as Record<string, unknown>).message === 'string'
                  ? ((e as Record<string, unknown>).message as string)
                  : String(e);
            console.warn('查询会议明细失败，跳过详情缓存：', errMsg);
          }

          // 映射变量并写入表格（subject/meeting_code/start_time/end_time/platform）
          try {
            const meta = this.larkMeetingCacheService.getMeetingMeta(meetingId);
            const detail =
              this.larkMeetingCacheService.getMeetingDetail(meetingId);

            const subject = meta?.topic;
            const rawMeetingCode: unknown =
              detail?.meeting_no ??
              meta?.meetingNo ??
              detail?.meeting_id ??
              meetingId;
            const meeting_code =
              getString(rawMeetingCode) ?? String(rawMeetingCode);

            // 使用前面解析出的临时变量 startTime / endTime，不再读取 detail 的 meeting_* 字段
            const start_time_raw: unknown = startTime ?? meta?.startTime;
            const end_time_raw: unknown = endTime ?? meta?.endTime;

            // 统一转换为毫秒级时间戳：
            // - 若输入为“秒”时间戳（< 1e11），乘以 1000
            // - 若输入为“毫秒”时间戳（>= 1e11），直接取整
            // - 若为可解析的日期字符串，使用 Date.parse 得到毫秒
            const toMsTimestamp = (v: unknown): number | undefined => {
              if (v instanceof Date) {
                return v.getTime();
              }
              if (typeof v === 'number') {
                if (!Number.isFinite(v)) return undefined;
                return v < 1e11 ? Math.floor(v * 1000) : Math.floor(v);
              }
              if (typeof v === 'string') {
                const s = v.trim();
                if (s === '') return undefined;
                const num = Number(s);
                if (Number.isFinite(num)) {
                  return num < 1e11 ? Math.floor(num * 1000) : Math.floor(num);
                }
                const parsed = Date.parse(s);
                return Number.isFinite(parsed) ? parsed : undefined;
              }
              return undefined;
            };

            const start_time = toMsTimestamp(start_time_raw);
            const end_time = toMsTimestamp(end_time_raw);

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

            if (this.larkMeetingCacheService.isMeetingWritten(meetingId)) {
              console.warn('检测到重复的会议写入, 跳过', { meetingId });
            } else {
              await this.larkMeetingWriterService.upsertMeeting({
                platform,
                meeting_id: meetingId,
                ...(subject && { subject }),
                ...(meeting_code && { meeting_code }),
                ...(start_time !== undefined && { start_time }),
                ...(end_time !== undefined && { end_time }),
              });
              this.larkMeetingCacheService.markMeetingWritten(meetingId);
              console.log('已写入会议记录到 Bitable：', {
                meeting_id: meetingId,
                subject,
                meeting_code,
                start_time,
                end_time,
                platform,
              });
            }
          } catch (e) {
            const errMsg =
              e instanceof Error
                ? e.message
                : typeof e === 'object' &&
                    e !== null &&
                    'message' in e &&
                    typeof (e as Record<string, unknown>).message === 'string'
                  ? ((e as Record<string, unknown>).message as string)
                  : String(e);
            console.warn('写入会议记录到 Bitable 失败：', errMsg);
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
          if (
            this.larkMeetingCacheService.isProcessingMinuteToken(minuteToken)
          ) {
            console.warn('检测到重复的 minuteToken, 跳过处理:', minuteToken);
            return;
          }
          this.larkMeetingCacheService.markProcessingMinuteToken(minuteToken);
          try {
            // 延时 3 分钟后再请求纪要转写
            await new Promise((resolve) => setTimeout(resolve, 3 * 60 * 1000));
            await this.minuteTranscriptService.saveTranscript(
              minuteToken,
              'txt',
            );
          } finally {
            // Step L: 清理 minuteToken 处理标记
            this.larkMeetingCacheService.clearProcessingMinuteToken(
              minuteToken,
            );
          }
        } catch (error) {
          // Step Z: 捕获并记录事件处理中的意外错误
          console.error('处理会议结束事件出错：', error);
        }
      },
    });

    // Step 5: 启动 WSClient 并注册事件分发器（加上 try/catch 便于定位启动失败）
    try {
      void this.wsClient.start({
        eventDispatcher: dispatcher,
      });
      console.log('✅ Lark WSClient 已启动并监听事件');
    } catch (e) {
      console.error('❌ Lark WSClient 启动失败：', e);
    }
  }
}
