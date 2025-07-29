import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookConfigException } from '../../../exceptions/webhook.exceptions';

/**
 * 腾讯会议配置服务
 * 负责统一管理腾讯会议相关的配置获取和验证
 */
@Injectable()
export class TencentConfigService {
    private readonly logger = new Logger(TencentConfigService.name);
    private readonly configCache = new Map<string, string>();
    private readonly PLATFORM_NAME = 'TENCENT_MEETING';

    constructor(private readonly configService: ConfigService) {
        this.initializeConfig();
    }

    /**
     * 初始化配置缓存
     */
    private initializeConfig(): void {
        try {
            const requiredConfigs = [
                'TENCENT_MEETING_TOKEN',
                'TENCENT_MEETING_ENCODING_AES_KEY',
                'TENCENT_MEETING_SECRET_ID',
                'TENCENT_MEETING_SECRET_KEY',
                'TENCENT_MEETING_APP_ID',
                'TENCENT_MEETING_SDK_ID'
            ];

            for (const configKey of requiredConfigs) {
                const value = this.configService.get<string>(configKey);
                if (value) {
                    this.configCache.set(configKey, value);
                } else {
                    this.logger.warn(`配置项 ${configKey} 未设置`);
                }
            }

            this.logger.log('腾讯会议配置初始化完成');
        } catch (error) {
            this.logger.error('腾讯会议配置初始化失败', error);
        }
    }

    /**
     * 获取腾讯会议Token
     */
    getToken(): string {
        const token = this.getConfig('TENCENT_MEETING_TOKEN');
        if (!token) {
            throw new WebhookConfigException(this.PLATFORM_NAME, 'TENCENT_MEETING_TOKEN');
        }
        return token;
    }

    /**
     * 获取腾讯会议AES加密密钥
     */
    getEncodingAesKey(): string {
        const key = this.getConfig('TENCENT_MEETING_ENCODING_AES_KEY');
        if (!key) {
            throw new WebhookConfigException(this.PLATFORM_NAME, 'TENCENT_MEETING_ENCODING_AES_KEY');
        }
        return key;
    }

    /**
     * 获取腾讯会议Secret ID
     */
    getSecretId(): string {
        const secretId = this.getConfig('TENCENT_MEETING_SECRET_ID');
        if (!secretId) {
            throw new WebhookConfigException(this.PLATFORM_NAME, 'TENCENT_MEETING_SECRET_ID');
        }
        return secretId;
    }

    /**
     * 获取腾讯会议Secret Key
     */
    getSecretKey(): string {
        const secretKey = this.getConfig('TENCENT_MEETING_SECRET_KEY');
        if (!secretKey) {
            throw new WebhookConfigException(this.PLATFORM_NAME, 'TENCENT_MEETING_SECRET_KEY');
        }
        return secretKey;
    }

    /**
     * 获取腾讯会议App ID
     */
    getAppId(): string {
        const appId = this.getConfig('TENCENT_MEETING_APP_ID');
        if (!appId) {
            throw new WebhookConfigException(this.PLATFORM_NAME, 'TENCENT_MEETING_APP_ID');
        }
        return appId;
    }

    /**
     * 获取腾讯会议SDK ID
     */
    getSdkId(): string {
        const sdkId = this.getConfig('TENCENT_MEETING_SDK_ID');
        if (!sdkId) {
            throw new WebhookConfigException(this.PLATFORM_NAME, 'TENCENT_MEETING_SDK_ID');
        }
        return sdkId;
    }

    /**
     * 获取配置项
     * @param key 配置键
     * @returns 配置值
     */
    private getConfig(key: string): string | undefined {
        // 优先从缓存获取
        if (this.configCache.has(key)) {
            return this.configCache.get(key);
        }

        // 从ConfigService获取并缓存
        const value = this.configService.get<string>(key);
        if (value) {
            this.configCache.set(key, value);
        }
        return value;
    }

    /**
     * 验证所有必需的配置是否存在
     * @returns 验证结果
     */
    validateConfig(): boolean {
        try {
            this.getToken();
            this.getEncodingAesKey();
            return true;
        } catch (error) {
            this.logger.error('腾讯会议配置验证失败', error);
            return false;
        }
    }

    /**
     * 刷新配置缓存
     */
    refreshConfig(): void {
        this.configCache.clear();
        this.initializeConfig();
        this.logger.log('腾讯会议配置缓存已刷新');
    }

    /**
     * 获取平台名称
     */
    getPlatformName(): string {
        return this.PLATFORM_NAME;
    }
}