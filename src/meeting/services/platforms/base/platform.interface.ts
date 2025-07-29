import { MeetingPlatform } from '@prisma/client';

/**
 * 会议平台基础接口
 */
export interface IPlatformService {
    /**
     * 平台类型
     */
    readonly platform: MeetingPlatform;

    /**
     * 获取录制文件详情
     * @param fileId 录制文件ID
     * @param userId 用户ID
     */
    getRecordingFileDetail(fileId: string, userId: string): Promise<any>;

    /**
     * 获取会议录制列表
     * @param params 查询参数
     */
    getRecordingList(params: any): Promise<any>;

    /**
     * 获取会议详情
     * @param meetingId 会议ID
     * @param userId 用户ID
     */
    getMeetingDetail(meetingId: string, userId: string): Promise<any>;

    /**
     * 获取会议参与者列表
     * @param meetingId 会议ID
     * @param userId 用户ID
     */
    getMeetingParticipants(meetingId: string, userId: string): Promise<any>;
}

/**
 * Webhook处理器接口
 */
export interface IWebhookHandler {
    /**
     * 验证webhook签名
     * @param params 验证参数
     */
    verifySignature(params: any): boolean;

    /**
     * 解密webhook数据
     * @param encryptedData 加密数据
     * @param key 解密密钥
     */
    decryptData(encryptedData: string, key: string): Promise<string>;

    /**
     * 处理webhook事件
     * @param eventData 事件数据
     */
    handleEvent(eventData: any): Promise<void>;
}

/**
 * API客户端接口
 */
export interface IApiClient {
    /**
     * 发送GET请求
     * @param url 请求URL
     * @param headers 请求头
     */
    get(url: string, headers?: Record<string, string>): Promise<any>;

    /**
     * 发送POST请求
     * @param url 请求URL
     * @param data 请求数据
     * @param headers 请求头
     */
    post(url: string, data?: any, headers?: Record<string, string>): Promise<any>;

    /**
     * 生成请求签名
     * @param params 签名参数
     */
    generateSignature(params: any): string;
}