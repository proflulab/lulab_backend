import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * 飞书Webhook日志拦截器
 * 记录所有飞书Webhook请求的详细信息
 */
@Injectable()
export class WebhookLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WebhookLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // 提取关键信息
    const { method, url, headers, body, query, ip } = request;

    // 记录请求开始
    this.logger.log(`飞书Webhook请求开始: ${method} ${url}`, {
      ip,
      userAgent: headers['user-agent'],
      contentType: headers['content-type'],
      contentLength: headers['content-length'],
      query: Object.keys(query).length > 0 ? query : undefined,
      timestamp: new Date().toISOString(),
    });

    // 记录重要的请求头（过滤敏感信息）
    const importantHeaders = this.filterHeaders(headers);
    if (Object.keys(importantHeaders).length > 0) {
      this.logger.debug('重要请求头:', importantHeaders);
    }

    // 记录请求体（如果不是太大）
    if (body && this.shouldLogBody(body, headers)) {
      this.logger.debug('请求体:', {
        bodyType: typeof body,
        bodySize: JSON.stringify(body).length,
        body: this.sanitizeBody(body),
      });
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;

        this.logger.log(
          `飞书Webhook请求成功: ${method} ${url} - ${response.statusCode} - ${duration}ms`,
          {
            statusCode: response.statusCode,
            duration,
            responseType: typeof data,
            responseSize: data ? JSON.stringify(data).length : 0,
            timestamp: new Date().toISOString(),
          },
        );

        // 记录响应数据（如果有且不是太大）
        if (data && this.shouldLogResponse(data)) {
          this.logger.debug('响应数据:', {
            data: this.sanitizeResponse(data),
          });
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        this.logger.error(
          `飞书Webhook请求失败: ${method} ${url} - ${duration}ms`,
          {
            error: error.message,
            stack: error.stack,
            statusCode: error.status || 500,
            duration,
            timestamp: new Date().toISOString(),
          },
        );

        throw error;
      }),
    );
  }

  /**
   * 过滤请求头，只保留重要的非敏感信息
   */
  private filterHeaders(headers: Record<string, any>): Record<string, any> {
    const importantHeaders: Record<string, any> = {};

    // 需要记录的重要头部
    const headersToLog = [
      'x-feishu-signature',
      'x-feishu-timestamp',
      'x-feishu-nonce',
      'content-type',
      'content-length',
      'user-agent',
      'x-forwarded-for',
      'x-real-ip',
    ];

    for (const key of headersToLog) {
      const lowerKey = key.toLowerCase();
      const value = headers[key] || headers[lowerKey];
      if (value) {
        // 对签名进行部分遮蔽
        if (key.includes('signature')) {
          importantHeaders[key] = this.maskSignature(value);
        } else {
          importantHeaders[key] = value;
        }
      }
    }

    return importantHeaders;
  }

  /**
   * 判断是否应该记录请求体
   */
  private shouldLogBody(body: any, headers: Record<string, any>): boolean {
    // 不记录太大的请求体
    const bodySize = JSON.stringify(body).length;
    if (bodySize > 10000) {
      // 10KB限制
      return false;
    }

    // 不记录二进制内容
    const contentType = headers['content-type'] || '';
    if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/octet-stream')
    ) {
      return false;
    }

    return true;
  }

  /**
   * 判断是否应该记录响应数据
   */
  private shouldLogResponse(data: any): boolean {
    if (!data) return false;

    const dataSize = JSON.stringify(data).length;
    return dataSize <= 5000; // 5KB限制
  }

  /**
   * 清理请求体中的敏感信息
   */
  private sanitizeBody(body: any): any {
    if (typeof body !== 'object' || body === null) {
      return body;
    }

    const sanitized = { ...body };

    // 移除或遮蔽敏感字段
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'credential',
      'app_secret',
      'app_key',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***MASKED***';
      }
    }

    // 递归处理嵌套对象
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeBody(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * 清理响应数据中的敏感信息
   */
  private sanitizeResponse(data: any): any {
    return this.sanitizeBody(data);
  }

  /**
   * 遮蔽签名信息（只显示前8位和后8位）
   */
  private maskSignature(signature: string): string {
    if (signature.length <= 16) {
      return '***';
    }
    return `${signature.substring(0, 8)}...${signature.substring(signature.length - 8)}`;
  }
}
