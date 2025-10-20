/**
 * LarkMeetingWriterService（会议写入服务）
 * 用途：
 * - 将飞书/Lark 会议数据写入或更新 Bitable（会议记录表）
 * - 提供通用 upsertMeeting 与基于事件缓存的 upsertFromEvent 两种入口
 * - 通过 MeetingBitableRepository 实现幂等写入（meeting_id/sub_meeting_id 作为匹配键）
 * - 统一 platform 字段为 'feishu'，并保留日志与错误处理逻辑
 * 说明：
 * - 文件中包含获取 tenant token 与 HTTP 请求的辅助方法，属于历史/备用实现；当前 upsert 走仓储层
 */
import { Injectable, Logger } from '@nestjs/common';
import { MeetingBitableRepository } from '@lark/repositories';
import { MeetingData } from '@lark/types';
import * as https from 'https';
import { URL } from 'url';
import { LarkMeetingCacheService } from './lark-meeting-cache.service';

// 类型辅助与安全解析
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const safeStringify = (v: unknown): string => {
  try {
    return typeof v === 'string' ? v : JSON.stringify(v);
  } catch {
    return '[Unserializable]';
  }
};

const getString = (v: unknown): string | undefined => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return undefined;
};

export interface MeetingMetaInput {
  topic?: string;
  meetingNo?: string | number;
  startTime?: string | number;
  endTime?: string | number;
}

export interface MeetingDetailInput {
  meeting_end_time?: string | number;
  meeting_id?: string;
  meeting_instance_id?: string;
  meeting_start_time?: string | number;
  meeting_no?: string | number;
  organizer?: unknown;
  user_id?: string;
  participants?: Array<{ id?: string; name?: string } | string>;
  meeting_type?: string | string[];
}

@Injectable()
export class LarkMeetingWriterService {
  private readonly logger = new Logger(LarkMeetingWriterService.name);

  constructor(
    private readonly meetingRepo: MeetingBitableRepository,
    private readonly larkMeetingCacheService: LarkMeetingCacheService,
  ) {}

  private getDomainEnv(): string {
    return (process.env.LARK_DOMAIN || '').toLowerCase();
  }

  private getHost(): string {
    return this.getDomainEnv() === 'feishu'
      ? 'https://open.feishu.cn'
      : 'https://open.larksuite.com';
  }

  private getAppToken(): string {
    return process.env.LARK_BITABLE_APP_TOKEN || '';
  }

  private getTableId(): string {
    return (
      process.env.LARK_BITABLE_TABLE_ID ||
      process.env.LARK_TABLE_ID ||
      process.env.LARK_TABLE_MEETING_RECORD ||
      process.env.LARK_TABLE_MEETING ||
      ''
    );
  }

  private mask(v?: string): string {
    if (!v) return '(empty)';
    return `${v.slice(0, 4)}...${v.slice(-4)}`;
  }

  private async fetchTenantAccessTokenInternal(): Promise<string> {
    const appId = process.env.LARK_APP_ID || '';
    const appSecret = process.env.LARK_APP_SECRET || '';
    const host = this.getHost();
    const urlStr = `${host}/open-apis/auth/v3/tenant_access_token/internal`;

    const body = {
      app_id: appId,
      app_secret: appSecret,
    };

    const resp = await new Promise<{ status: number; data: unknown }>(
      (resolve, reject) => {
        try {
          const u = new URL(urlStr);
          const data = JSON.stringify(body);
          const req = https.request(
            {
              protocol: u.protocol,
              hostname: u.hostname,
              path: u.pathname + u.search,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(data).toString(),
              },
            },
            (res) => {
              let raw = '';
              res.setEncoding('utf8');
              res.on('data', (chunk) => (raw += chunk));
              res.on('end', () => {
                let parsed: unknown;
                try {
                  parsed = raw ? JSON.parse(raw) : {};
                } catch {
                  return resolve({ status: res.statusCode || 0, data: raw });
                }
                resolve({ status: res.statusCode || 0, data: parsed });
              });
            },
          );
          req.on('error', (err) =>
            reject(err instanceof Error ? err : new Error(safeStringify(err))),
          );
          req.write(data);
          req.end();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(safeStringify(err)));
        }
      },
    );

    if (resp.status !== 200) {
      throw new Error(
        `获取 tenant_access_token 失败, status=${resp.status}, body=${safeStringify(resp.data)}`,
      );
    }
    const respData = isRecord(resp.data) ? resp.data : {};
    const code = typeof respData.code === 'number' ? respData.code : undefined;
    const tenantAccessToken =
      typeof respData.tenant_access_token === 'string'
        ? respData.tenant_access_token
        : undefined;
    if (code !== 0 || !tenantAccessToken) {
      throw new Error(
        `获取 tenant_access_token 返回异常: ${safeStringify(resp.data)}`,
      );
    }
    return tenantAccessToken;
  }

  private async postJsonWithAuth(
    urlInput: string,
    payload: unknown,
    tenantToken: string,
  ) {
    return new Promise<{ status: number; data: unknown; raw: string }>(
      (resolve, reject) => {
        try {
          const u = new URL(urlInput);
          const data = JSON.stringify(payload);
          const req = https.request(
            {
              protocol: u.protocol,
              hostname: u.hostname,
              path: u.pathname + u.search,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(data).toString(),
                Authorization: `Bearer ${tenantToken}`,
              },
            },
            (res) => {
              let raw = '';
              res.setEncoding('utf8');
              res.on('data', (chunk) => (raw += chunk));
              res.on('end', () => {
                let parsed: unknown;
                try {
                  parsed = raw ? JSON.parse(raw) : {};
                } catch {
                  return resolve({
                    status: res.statusCode || 0,
                    data: raw,
                    raw,
                  });
                }
                resolve({ status: res.statusCode || 0, data: parsed, raw });
              });
            },
          );
          req.on('error', (err) =>
            reject(err instanceof Error ? err : new Error(safeStringify(err))),
          );
          req.write(data);
          req.end();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(safeStringify(err)));
        }
      },
    );
  }

  private async bitableBatchCreateViaHttp(
    appToken: string,
    tableId: string,
    body: unknown,
    tenantToken: string,
  ) {
    const host = this.getHost();
    const urlStr = `${host}/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/records/batch_create`;
    const resp = await this.postJsonWithAuth(urlStr, body, tenantToken);
    if (resp.status !== 200) {
      throw new Error(
        `batch_create 请求失败, status=${resp.status}, body=${safeStringify(resp.data)}`,
      );
    }
    return resp.data;
  }

  private toNum(value?: string | number): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  private toString(value?: string | number): string | undefined {
    if (value === undefined || value === null) return undefined;
    return String(value);
  }

  // 将缓存中的 organizer 转为写入字段值（operator/creator），默认使用 JSON 字符串表示原始变量
  private buildOperatorCreatorFromDetail(
    detail?: MeetingDetailInput,
  ): string[] {
    if (!detail) return [];
    const org = detail.organizer;
    if (org !== undefined) {
      if (typeof org === 'string') return [org];
      // 优先提取可识别的 user_id，否则直接序列化整个变量
      if (isRecord(org)) {
        const orgRec = org; // 已通过类型保护，orgRec: Record<string, unknown>
        const idVal = orgRec['id'];
        const idRec = isRecord(idVal) ? idVal : undefined;
        const candidateId =
          getString(idRec?.['user_id']) ?? getString(orgRec['user_id']);
        if (candidateId) return [candidateId];
      }
      return [safeStringify(org)];
    }
    if (detail.user_id) return [String(detail.user_id)];
    return [];
  }

  /**
   * 通用写入：直接依据 MeetingData 写入（upsert）
   */
  async upsertMeeting(data: MeetingData) {
    this.logger.debug('Upserting meeting record to Bitable (repo)', {
      meeting_id: data.meeting_id,
    });

    // 若缓存中存在 organizer，则自动补充 operator/creator 字段（除非调用方已显式传入）
    const cachedDetail = this.larkMeetingCacheService.getMeetingDetail(
      data.meeting_id,
    ) as MeetingDetailInput | undefined;
    const autoOpCreator = this.buildOperatorCreatorFromDetail(cachedDetail);

    // 统一平台字段为 feishu，保持与既有表结构兼容
    const payload: MeetingData = {
      ...data,
      platform: 'feishu',
      ...(autoOpCreator.length > 0 && {
        operator: data.operator ?? autoOpCreator,
      }),
      ...(autoOpCreator.length > 0 && {
        creator: data.creator ?? autoOpCreator,
      }),
    };

    try {
      const res = await this.meetingRepo.upsertMeetingRecord(payload);
      const recordId = res?.data?.record?.record_id;
      this.logger.debug('upsertMeeting success', {
        record_id: recordId,
        meeting_id: data.meeting_id,
      });
      return res;
    } catch (err: unknown) {
      this.logger.error('upsertMeeting failed', err);
      throw err instanceof Error ? err : new Error(safeStringify(err));
    }
  }

  /**
   * 依据事件缓存的 meta/detail 写入（upsert）到 meeting 表
   * - 优先使用 detail 的时间字段；回退到 meta 的时间字段
   * - 平台固定为“飞书”
   * - 可选填充 subject、meeting_code、operator、creator、participants、meeting_type
   */
  async upsertFromEvent(
    meetingId: string,
    meta?: MeetingMetaInput,
    detail?: MeetingDetailInput,
  ) {
    const startTime =
      this.toNum(detail?.meeting_start_time) ?? this.toNum(meta?.startTime);
    const endTime =
      this.toNum(detail?.meeting_end_time) ?? this.toNum(meta?.endTime);

    const subject = meta?.topic;
    const meetingCode =
      this.toString(detail?.meeting_no) ??
      this.toString(meta?.meetingNo) ??
      this.toString(detail?.meeting_id);

    // 直接使用 organizer 变量作为 operator/creator 的值（转为字符串数组）
    const opCreator = this.buildOperatorCreatorFromDetail(detail);

    // participants：兼容传入的多种形式（当前不写入，保持表结构一致）
    const participants: string[] = [];
    if (detail?.participants && Array.isArray(detail.participants)) {
      for (const p of detail.participants) {
        if (typeof p === 'string') participants.push(p);
        else if (p?.id) participants.push(String(p.id));
      }
    }

    // meeting_type：支持单值或数组（当前不写入，保持表结构一致）
    const meetingTypeArray: string[] = [];
    if (detail?.meeting_type) {
      const mt = detail.meeting_type;
      if (Array.isArray(mt)) meetingTypeArray.push(...mt.map(String));
      else meetingTypeArray.push(String(mt));
    }

    const record: MeetingData = {
      platform: 'feishu',
      meeting_id: meetingId,
      ...(subject && { subject }),
      ...(meetingCode && { meeting_code: meetingCode }),
      ...(startTime !== undefined && { start_time: startTime }),
      ...(endTime !== undefined && { end_time: endTime }),
      ...(opCreator.length > 0 && { operator: opCreator }),
      ...(opCreator.length > 0 && { creator: opCreator }),
      // 尝试映射子会议ID
      ...(detail?.meeting_instance_id && {
        sub_meeting_id: String(detail.meeting_instance_id),
      }),
    };

    return this.upsertMeeting(record);
  }
}
