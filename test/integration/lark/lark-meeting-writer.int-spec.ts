// node-sdk使用说明：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/server-side-sdk/nodejs-sdk/preparation-before-development
// 以下示例遵循官方Demo：直接使用 Node SDK 的 Client 和 batchCreate API

// 已移除未使用的 @larksuiteoapi/node-sdk 导入
import * as dotenv from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as https from 'https';
import { URL } from 'url';

// 优先读取 LARK_ENV_PATH 指定的文件，否则默认读取 .env
const ENV_PATH = process.env.LARK_ENV_PATH || '.env';
dotenv.config({ path: ENV_PATH });

const appId = process.env.LARK_APP_ID || '';
const appSecret = process.env.LARK_APP_SECRET || '';
const appToken = process.env.LARK_BITABLE_APP_TOKEN || '';
const domainEnv = (process.env.LARK_DOMAIN || '').toLowerCase();
// 兼容不同 SDK 版本的域名常量（有的版本是 Feishu，有的是 FeiShu；海外域名常量可能不存在）
// 已移除 SDK 域名常量兼容逻辑，直接使用 LARK_DOMAIN 选择 host
const tableId =
  process.env.LARK_BITABLE_TABLE_ID ||
  process.env.LARK_TABLE_ID ||
  process.env.LARK_TABLE_MEETING_RECORD ||
  process.env.LARK_TABLE_MEETING ||
  '';
// 可选：如果你已有租户Token，优先使用该环境变量
const tenantTokenFromEnv =
  process.env.LARK_TENANT_ACCESS_TOKEN || process.env.LARK_TENANT_TOKEN || '';

// 类型与日志辅助工具
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasResponseData(
  value: unknown,
): value is { response: { data: unknown } } {
  if (!isRecord(value)) return false;
  const response = value.response;
  return isRecord(response) && 'data' in response;
}

function safeStringify(value: unknown): string {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// 可选：将生成的 Token 写入指定环境文件，方便后续复用
function upsertEnvVar(filePath: string, key: string, value: string) {
  try {
    let content = '';
    if (existsSync(filePath)) {
      content = readFileSync(filePath, 'utf8');
    }
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      if (content && !content.endsWith('\n')) content += '\n';
      content += `${key}=${value}\n`;
    }
    writeFileSync(filePath, content, 'utf8');
    console.log(`已写入 ${key} 到 ${filePath}`);
  } catch (err) {
    console.warn(`写入 ${key} 到 ${filePath} 失败:`, err);
  }
}

/**
 * 调用 /open-apis/auth/v3/tenant_access_token/internal 接口获取 tenant_access_token
 */
async function fetchTenantAccessTokenInternal(
  appId: string,
  appSecret: string,
  domainEnv: string,
): Promise<{ tenant_access_token: string; expire: number }> {
  const host =
    domainEnv === 'feishu'
      ? 'https://open.feishu.cn'
      : 'https://open.larksuite.com';
  const urlStr = `${host}/open-apis/auth/v3/tenant_access_token/internal`;

  const body = {
    app_id: appId,
    app_secret: appSecret,
  };

  const postJson = (urlInput: string, payload: unknown) =>
    new Promise<{ status: number; data: unknown }>((resolve, reject) => {
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
              'Content-Length': String(Buffer.byteLength(data)),
            },
          },
          (res) => {
            let raw = '';
            res.setEncoding('utf8');
            res.on('data', (chunk: string) => (raw += chunk));
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
    });

  const resp = await postJson(urlStr, body);

  if (resp.status !== 200) {
    throw new Error(
      `获取 tenant_access_token failed, status=${resp.status}, body=${safeStringify(resp.data)}`,
    );
  }
  const dataObj = isRecord(resp.data) ? resp.data : {};
  const code = typeof dataObj.code === 'number' ? dataObj.code : undefined;
  const token =
    typeof dataObj.tenant_access_token === 'string'
      ? dataObj.tenant_access_token
      : '';
  const expire = typeof dataObj.expire === 'number' ? dataObj.expire : 0;
  if (code !== 0 || !token) {
    throw new Error(
      `获取 tenant_access_token 返回异常: ${safeStringify(resp.data)}`,
    );
  }
  return {
    tenant_access_token: token,
    expire,
  };
}

// 以与官方调试台一致的方式，直接 POST JSON 到 bitable batch_create 接口
async function postJsonWithAuth(
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
              'Content-Length': String(Buffer.byteLength(data)),
              Authorization: `Bearer ${tenantToken}`,
            },
          },
          (res) => {
            let raw = '';
            res.setEncoding('utf8');
            res.on('data', (chunk: string) => (raw += chunk));
            res.on('end', () => {
              let parsed: unknown;
              try {
                parsed = raw ? JSON.parse(raw) : {};
              } catch {
                return resolve({ status: res.statusCode || 0, data: raw, raw });
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

async function bitableBatchCreateViaHttp(
  appToken: string,
  tableId: string,
  domainEnv: string,
  tenantToken: string,
  body: unknown,
) {
  const host =
    domainEnv === 'feishu'
      ? 'https://open.feishu.cn'
      : 'https://open.larksuite.com';
  const urlStr = `${host}/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/records/batch_create`;

  const resp = await postJsonWithAuth(urlStr, body, tenantToken);
  if (resp.status !== 200) {
    throw new Error(
      `batch_create 请求失败, status=${resp.status}, body=${safeStringify(resp.data)}`,
    );
  }
  return resp.data;
}

// 开发者复制该Demo后，需要修改Demo里面的"app id", "app secret"为自己应用的appId, appSecret
// 已移除 SDK Client 初始化，改用直连 Open API 的 HTTPS 请求

function isLikelyTableId(id: string) {
  return typeof id === 'string' && id.startsWith('tbl') && id.length > 8;
}

async function main() {
  console.log('启动示例：batchCreate 多维表格记录');

  if (!appId || !appSecret) {
    console.warn('环境变量缺失：请设置 LARK_APP_ID 和 LARK_APP_SECRET');
  }
  if (!appToken || !tableId) {
    console.warn(
      '环境变量缺失：请设置 LARK_BITABLE_APP_TOKEN 和 LARK_TABLE_MEETING_RECORD 或 LARK_TABLE_MEETING',
    );
  }

  let tenantToken = tenantTokenFromEnv;
  if (!tenantToken) {
    console.log('未提供租户令牌，从 open API 获取 tenant_access_token …');
    try {
      const result = await fetchTenantAccessTokenInternal(
        appId,
        appSecret,
        domainEnv,
      );
      tenantToken = result.tenant_access_token;
      console.log('获取到 tenant_access_token，expire(s):', result.expire);
      const writeFlag =
        (process.env.WRITE_TENANT_TOKEN_TO_ENV || '').toLowerCase() === 'true';
      const envPath = ENV_PATH;
      if (writeFlag) {
        upsertEnvVar(envPath, 'LARK_TENANT_ACCESS_TOKEN', tenantToken);
      }
    } catch (err: any) {
      console.error('自动获取 tenant_access_token 失败：', err);
      process.exit(1);
    }
  } else {
    console.log('使用已有租户令牌（来自环境变量）');
  }

  const mask = (v: string) =>
    v ? `${v.slice(0, 4)}...${v.slice(-4)}` : '(empty)';
  console.log('配置（打码）:', {
    appId: mask(appId),
    appSecret: mask(appSecret),
    appToken: mask(appToken),
    tableId: mask(tableId),
    tenantToken: mask(tenantToken),
  });

  console.log(`🗂️ 环境变量文件: ${ENV_PATH}`);

  // 调试：打印实际使用的 app_token
  console.log(`🧩 当前使用的 App Token（未打码）: ${appToken || '(空)'}`);
  // 调试：打印实际使用的 table_id
  console.log(`🧩 当前使用的表 ID（未打码）: ${tableId || '(空)'}`);

  // 快速校验常见取值错误
  if (appToken && !appToken.startsWith('app')) {
    console.warn(
      '提示：当前 app_token 非常见格式（通常以 "app" 开头），请确认是否填写正确。',
    );
  }
  if (!isLikelyTableId(tableId)) {
    console.error('表 ID 看起来不正确（通常以 "tbl" 开头）。');
    console.error('请按以下方式获取并填写正确的表 ID：');
    console.error(
      '1) 在多维表格页面 URL 中直接获取 table_id（feishu.cn/base/... 链接中包含）。',
    );
    console.error('2) 或使用相关 API 列出数据表以获取 table_id。');
    console.error(
      '3) 将其写入 .env.test 的 LARK_BITABLE_TABLE_ID（或 LARK_TABLE_ID）后重试。',
    );
    process.exit(1);
  }

  // 额外打印租户Token（仅调试用）。设置环境变量 DEBUG_PRINT_TENANT_TOKEN=true 可打印完整Token
  const debugPrintFull =
    (process.env.DEBUG_PRINT_TENANT_TOKEN || '').toLowerCase() === 'true';
  if (debugPrintFull) {
    console.log('tenantToken(完整)：', tenantToken || '(empty)');
  } else {
    console.log('tenantToken(掩码)：', mask(tenantToken));
  }

  // ===== 调试辅助：列出表字段信息 =====
  console.log('📋 开始获取表字段信息...');
  try {
    const host =
      domainEnv === 'feishu'
        ? 'https://open.feishu.cn'
        : 'https://open.larksuite.com';
    const url = `${host}/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/fields`;

    const u = new URL(url);
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tenantToken}`,
        },
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (raw += chunk));
        res.on('end', () => {
          try {
            const data: unknown = JSON.parse(raw);
            console.log('📋 表字段信息：', JSON.stringify(data, null, 2));
          } catch {
            console.log('📋 原始响应：', raw);
          }
        });
      },
    );
    req.on('error', (err) =>
      console.error('❌ 获取表字段信息失败：', safeStringify(err)),
    );
    req.end();
  } catch (err: unknown) {
    console.error('❌ 获取表字段信息失败：', safeStringify(err));
  }

  // 按照实际表字段构造请求体（基于获取到的字段信息）
  const requestBody = {
    records: [
      {
        fields: {
          meeting_id: '2212355',
          platform: 'feishu',
          subject: '测试会议',
          sub_meeting_id: '123456',
          meeting_code: '123456',
          start_time: 1692000000000,
          end_time: 1692003600000,
          // 注意：operator 和 creator 是双向关联字段，需要提供记录ID而不是字符串
          // 暂时注释掉关联字段，先测试基础字段
          // "operator": ["recXXXXXX"],  // 需要实际的记录ID
          // "creator": ["recYYYYYY"],   // 需要实际的记录ID
        },
      },
    ],
  };

  try {
    if (!tenantToken) throw new Error('缺少租户 token，无法调用 batch_create');
    const res = await bitableBatchCreateViaHttp(
      appToken,
      tableId,
      domainEnv,
      tenantToken,
      requestBody,
    );
    console.log('✅ batchCreate 成功：', JSON.stringify(res, null, 2));
  } catch (err: unknown) {
    const payload = hasResponseData(err) ? err.response.data : err;
    console.error('❌ batchCreate 失败：', safeStringify(payload));
  }

  // 给日志一个缓冲时间，避免进程过快退出导致日志未刷出
  await new Promise((resolve) => setTimeout(resolve, 200));
  console.log('示例脚本执行完成');
}

main().catch((err: unknown) => {
  console.error('脚本执行异常：', safeStringify(err));
  process.exit(1);
});
