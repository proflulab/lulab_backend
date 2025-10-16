import { Injectable, Logger } from '@nestjs/common';
import { MeetingBitableRepository } from '@lark/repositories';
import { MeetingData } from '@lark/types';
import * as https from 'https';
import { URL } from 'url';

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
  organizer?: any;
  user_id?: string;
  participants?: Array<{ id?: string; name?: string } | string>;
  meeting_type?: string | string[];
}

@Injectable()
export class LarkMeetingWriterService {
  private readonly logger = new Logger(LarkMeetingWriterService.name);

  constructor(
    private readonly meetingRepo: MeetingBitableRepository,
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

    const resp = await new Promise<{ status: number; data: any }>((resolve, reject) => {
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
              let parsed: any;
              try {
                parsed = raw ? JSON.parse(raw) : {};
              } catch (e) {
                return resolve({ status: res.statusCode || 0, data: raw });
              }
              resolve({ status: res.statusCode || 0, data: parsed });
            });
          },
        );
        req.on('error', (err) => reject(err));
        req.write(data);
        req.end();
      } catch (err) {
        reject(err);
      }
    });

    if (resp.status !== 200) {
      throw new Error(`获取 tenant_access_token 失败, status=${resp.status}, body=${JSON.stringify(resp.data)}`);
    }
    const respData = resp.data;
    if (respData.code !== 0 || !respData.tenant_access_token) {
      throw new Error(`获取 tenant_access_token 返回异常: ${JSON.stringify(respData)}`);
    }
    return respData.tenant_access_token as string;
  }

  private async postJsonWithAuth(urlInput: string, payload: any, tenantToken: string) {
    return new Promise<{ status: number; data: any; raw: string }>((resolve, reject) => {
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
              let parsed: any;
              try {
                parsed = raw ? JSON.parse(raw) : {};
              } catch {
                return resolve({ status: res.statusCode || 0, data: raw, raw });
              }
              resolve({ status: res.statusCode || 0, data: parsed, raw });
            });
          },
        );
        req.on('error', (err) => reject(err));
        req.write(data);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private async bitableBatchCreateViaHttp(appToken: string, tableId: string, body: any, tenantToken: string) {
    const host = this.getHost();
    const urlStr = `${host}/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/records/batch_create`;
    const resp = await this.postJsonWithAuth(urlStr, body, tenantToken);
    if (resp.status !== 200) {
      throw new Error(`batch_create 请求失败, status=${resp.status}, body=${typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data)}`);
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

  /**
   * 通用写入：直接依据 MeetingData 写入（upsert）
   */
  async upsertMeeting(data: MeetingData) {
    this.logger.debug('Upserting meeting record to Bitable (HTTP)', {
      meeting_id: data.meeting_id,
    });

    const appToken = this.getAppToken();
    const tableId = this.getTableId();
    let tenantToken = process.env.LARK_TENANT_ACCESS_TOKEN || process.env.LARK_TENANT_TOKEN || '';

    // 基本校验与日志
    this.logger.debug('Bitable config (masked)', {
      appToken: this.mask(appToken),
      tableId: this.mask(tableId),
    });
    if (!appToken) throw new Error('缺少 LARK_BITABLE_APP_TOKEN');
    if (!tableId) throw new Error('缺少表ID (LARK_BITABLE_TABLE_ID / LARK_TABLE_ID / LARK_TABLE_MEETING_RECORD / LARK_TABLE_MEETING)');

    // 获取租户 token
    if (!tenantToken) {
      tenantToken = await this.fetchTenantAccessTokenInternal();
    }

    // 仅使用已验证存在的字段，避免使用不存在/类型不匹配的字段
    const fields: Record<string, any> = {};
    if (data.meeting_id) fields.meeting_id = data.meeting_id;
    fields.platform = 'feishu';
    if ((data as any).sub_meeting_id) fields.sub_meeting_id = (data as any).sub_meeting_id;
    if (data.subject) fields.subject = data.subject;
    if (data.meeting_code) fields.meeting_code = data.meeting_code;
    if (typeof (data as any).start_time !== 'undefined') fields.start_time = (data as any).start_time;
    if (typeof (data as any).end_time !== 'undefined') fields.end_time = (data as any).end_time;

    const body = { records: [{ fields }] };

    try {
      const res = await this.bitableBatchCreateViaHttp(appToken, tableId, body, tenantToken);
      this.logger.debug('batch_create success', res);
      return res;
    } catch (err: any) {
      this.logger.error('batch_create failed', err?.response?.data ?? err);
      throw err;
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

    // operator：尽量收集事件中的操作者/组织者ID
    const operator: string[] = [];
    if (detail?.user_id) operator.push(detail.user_id);
    const organizerId = detail?.organizer?.id?.user_id || detail?.organizer?.user_id;
    if (organizerId) operator.push(String(organizerId));

    // creator：如有可用字段则填充（目前与 operator 等价处理）
    const creator: string[] = organizerId ? [String(organizerId)] : [];

    // participants：兼容传入的多种形式
    const participants: string[] = [];
    if (detail?.participants && Array.isArray(detail.participants)) {
      for (const p of detail.participants) {
        if (typeof p === 'string') participants.push(p);
        else if (p?.id) participants.push(String(p.id));
      }
    }

    // meeting_type：支持单值或数组
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
      // 注意：operator/creator 是双向关联，需传递记录ID，此处不直接写入
      // ...(operator.length > 0 && { operator }),
      // ...(creator.length > 0 && { creator }),
      // participants/meeting_type 字段在当前表结构中不存在，避免写入
      // ...(participants.length > 0 && { participants }),
      // ...(meetingTypeArray.length > 0 && { meeting_type: meetingTypeArray }),
      // 尝试映射子会议ID
      ...(detail?.meeting_instance_id && { sub_meeting_id: String(detail.meeting_instance_id) }),
    };

    return this.upsertMeeting(record);
  }
}