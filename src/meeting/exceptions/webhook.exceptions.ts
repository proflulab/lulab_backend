import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Webhook相关异常基类
 */
export class WebhookException extends HttpException {
    constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
        super(message, status);
    }
}

/**
 * Webhook签名验证失败异常
 */
export class WebhookSignatureVerificationException extends WebhookException {
    constructor(platform: string) {
        super(
            `${platform} Webhook签名验证失败`,
            HttpStatus.UNAUTHORIZED
        );
    }
}

/**
 * Webhook数据解密失败异常
 */
export class WebhookDecryptionException extends WebhookException {
    constructor(platform: string, error: string) {
        super(
            `${platform} Webhook数据解密失败: ${error}`,
            HttpStatus.BAD_REQUEST
        );
    }
}

/**
 * Webhook事件类型不支持异常
 */
export class UnsupportedWebhookEventException extends WebhookException {
    constructor(platform: string, eventType: string) {
        super(
            `${platform} 不支持的Webhook事件类型: ${eventType}`,
            HttpStatus.BAD_REQUEST
        );
    }
}

/**
 * Webhook数据格式异常
 */
export class WebhookDataFormatException extends WebhookException {
    constructor(platform: string, field: string, expected: string) {
        super(
            `${platform} Webhook数据格式错误: ${field}, 期望: ${expected}`,
            HttpStatus.BAD_REQUEST
        );
    }
}

/**
 * Webhook处理超时异常
 */
export class WebhookProcessingTimeoutException extends WebhookException {
    constructor(platform: string, eventType: string, timeout: number) {
        super(
            `${platform} Webhook事件处理超时: ${eventType}, 超时时间: ${timeout}ms`,
            HttpStatus.REQUEST_TIMEOUT
        );
    }
}

/**
 * Webhook重复处理异常
 */
export class WebhookDuplicateProcessingException extends WebhookException {
    constructor(platform: string, eventId: string) {
        super(
            `${platform} Webhook事件重复处理: ${eventId}`,
            HttpStatus.CONFLICT
        );
    }
}

/**
 * Webhook配置异常
 */
export class WebhookConfigException extends WebhookException {
    constructor(platform: string, configKey: string) {
        super(
            `${platform} Webhook配置缺失: ${configKey}`,
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}

/**
 * Webhook URL验证异常
 */
export class WebhookUrlVerificationException extends WebhookException {
    constructor(platform: string, error: string) {
        super(
            `${platform} Webhook URL验证失败: ${error}`,
            HttpStatus.BAD_REQUEST
        );
    }
}