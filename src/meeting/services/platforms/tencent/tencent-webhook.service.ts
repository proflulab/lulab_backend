import { Injectable, Logger } from '@nestjs/common';
import { verifySignature, aesDecrypt } from './tencent-crypto.service';
import { TencentMeetingEvent } from '../../../types/tencent.types';
import {
    WebhookSignatureVerificationException,
    WebhookDecryptionException,
    WebhookUrlVerificationException
} from '../../../exceptions/webhook.exceptions';
import { TencentConfigService } from './tencent-config.service';
import { TencentEventValidator } from './tencent-event-validator.service';
import { TencentEventHandlerFactory } from './handlers/event-handler-factory';

/**
 * 腾讯会议Webhook处理器
 * 负责处理腾讯会议的Webhook验证和事件解析
 */
@Injectable()
export class TencentWebhookHandler {
    private readonly logger = new Logger(TencentWebhookHandler.name);

    constructor(
        private readonly configService: TencentConfigService,
        private readonly eventValidator: TencentEventValidator,
        private readonly eventHandlerFactory: TencentEventHandlerFactory
    ) { }

    /**
     * 验证腾讯会议Webhook URL
     * @param checkStr 待验证的字符串
     * @param timestamp 时间戳
     * @param nonce 随机数
     * @param signature 签名
     * @returns 解密后的明文
     */
    async verifyWebhookUrl(
        checkStr: string,
        timestamp: string,
        nonce: string,
        signature: string
    ): Promise<string> {
        this.logger.log('处理腾讯会议Webhook URL验证');

        try {
            // 1. 参数校验
            if (!checkStr || !timestamp || !nonce || !signature) {
                throw new WebhookUrlVerificationException(
                    'TENCENT_MEETING',
                    'Missing required parameters for URL verification'
                );
            }

            const token = this.configService.getToken();
            const encodingAesKey = this.configService.getEncodingAesKey();

            // 2. 签名验证
            const isValid = verifySignature(
                token,
                timestamp,
                nonce,
                decodeURIComponent(checkStr),
                signature
            );

            if (!isValid) {
                throw new WebhookSignatureVerificationException(
                    'TENCENT_MEETING'
                );
            }

            // 3. 解密check_str
            this.logger.log('开始解密check_str');
            const decryptedStr = await aesDecrypt(decodeURIComponent(checkStr), encodingAesKey);
            this.logger.log('腾讯会议Webhook URL验证解密成功');

            return decryptedStr;
        } catch (error) {
            this.logger.error('腾讯会议Webhook URL验证失败:', error);
            if (error instanceof WebhookSignatureVerificationException ||
                error instanceof WebhookUrlVerificationException) {
                throw error;
            }
            throw new WebhookUrlVerificationException(
                'TENCENT_MEETING',
                `URL verification failed: ${error.message}`
            );
        }
    }

    /**
     * 验证Webhook事件签名
     * @param timestamp 时间戳
     * @param nonce 随机数
     * @param signature 签名
     * @param data 数据
     * @returns 验证结果
     */
    private async verifySignature(
        timestamp: string,
        nonce: string,
        signature: string,
        data: string
    ): Promise<boolean> {
        try {
            const token = this.configService.getToken();
            return verifySignature(token, timestamp, nonce, data, signature);
        } catch (error) {
            this.logger.error('腾讯会议Webhook签名验证失败:', error);
            throw new WebhookSignatureVerificationException(
                'TENCENT_MEETING'
            );
        }
    }

    /**
     * 解密Webhook数据
     * @param encryptedData 加密数据
     * @returns 解密后的数据
     */
    private async decryptData(encryptedData: string): Promise<TencentMeetingEvent> {
        try {
            const encodingAesKey = this.configService.getEncodingAesKey();

            // 解密数据
            const decryptedData = await aesDecrypt(encryptedData, encodingAesKey);

            // 解析JSON
            const eventData: TencentMeetingEvent = JSON.parse(decryptedData);

            this.logger.log(`成功解密腾讯会议事件: ${eventData.event}`);
            return eventData;
        } catch (error) {
            this.logger.error('腾讯会议Webhook数据解密失败:', error);
            if (error instanceof SyntaxError) {
                throw new WebhookDecryptionException(
                    'TENCENT_MEETING',
                    'Failed to parse decrypted data as JSON'
                );
            }
            throw new WebhookDecryptionException(
                'TENCENT_MEETING',
                `Data decryption failed: ${error.message}`
            );
        }
    }

    /**
     * 获取支持的事件类型列表
     * @returns 支持的事件类型数组
     */
    getSupportedEvents(): string[] {
        return this.eventHandlerFactory.getSupportedEventTypes();
    }

    /**
     * 检查是否支持指定的事件类型
     * @param eventType 事件类型
     * @returns 是否支持
     */
    isEventSupported(eventType: string): boolean {
        return this.eventHandlerFactory.isEventSupported(eventType);
    }

    /**
     * 处理腾讯会议Webhook事件
     * 包含签名验证、数据解密和事件处理的完整流程
     */
    async handleWebhookEvent(
        encryptedData: string,
        timestamp: string,
        nonce: string,
        signature: string
    ): Promise<void> {
        this.logger.log('处理腾讯会议Webhook事件');

        try {
            // 验证签名
            const token = this.configService.getToken();
            const isValid = verifySignature(token, timestamp, nonce, encryptedData, signature);

            if (!isValid) {
                throw new WebhookSignatureVerificationException('TENCENT_MEETING');
            }

            // 解密数据
            const encodingAesKey = this.configService.getEncodingAesKey();
            const decryptedData = await aesDecrypt(encryptedData, encodingAesKey);

            // 解析JSON
            let eventData: TencentMeetingEvent;
            try {
                eventData = JSON.parse(decryptedData);
            } catch (error) {
                throw new WebhookDecryptionException(
                    'TENCENT_MEETING',
                    'Failed to parse decrypted data as JSON'
                );
            }

            this.logger.log(`成功解密腾讯会议事件: ${eventData.event}`);

            // 验证事件数据格式
            this.eventValidator.validateEventData(eventData);

            // 获取对应的事件处理器并处理事件
            const handler = this.eventHandlerFactory.getHandler(eventData.event);
            await handler.handleEvent(eventData);

            this.logger.log(`腾讯会议事件处理完成: ${eventData.event}`);

        } catch (error) {
            this.logger.error('处理腾讯会议Webhook事件失败', error.stack);

            if (error instanceof WebhookSignatureVerificationException ||
                error instanceof WebhookDecryptionException) {
                throw error;
            }

            if (error instanceof SyntaxError) {
                throw new WebhookDecryptionException(
                    'TENCENT_MEETING',
                    'Failed to parse decrypted data as JSON'
                );
            }

            throw error;
        }
    }
}