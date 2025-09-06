import { createHash, createHmac } from 'crypto';
import {
    WebhookSignatureVerificationException,
    WebhookUrlVerificationException
} from '../exceptions/webhook.exceptions';

/**
 * 对参数进行签名验证
 * @param token 配置的Token
 * @param timestamp 时间戳
 * @param nonce 随机数
 * @param data 数据（GET请求为check_str，POST请求为整个body）
 * @param signature 签名
 */
export function verifySignature(
    token: string,
    timestamp: string,
    nonce: string,
    data: string,
    signature: string
): boolean {
    // 1. 将token、timestamp、nonce、data四个参数进行字典序排序
    const arr = [token, timestamp, nonce, data].sort();

    // 2. 将四个参数字符串拼接成一个字符串
    const str = arr.join('');

    // 3. 对string进行sha1加密
    const sha1 = createHash('sha1');
    const computedSignature = sha1.update(str).digest('hex');

    // 4. 开发者获得加密后的字符串可与signature对比，标识该请求来源于腾讯会议
    return computedSignature === signature;
}

/**
 * AES解密
 * 根据腾讯会议文档要求：
 * - data字段先经过加密密钥加密后，再base64编码
 * - 需要先base64解码，再用加密密钥解密
 * 
 * @param encryptedText base64编码的加密文本
 * @param key base64编码的密钥（43位base64字符串）
 */
export async function aesDecrypt(encryptedText: string, key: string): Promise<string> {
    // 1. 导入Web Crypto API
    const crypto = globalThis.crypto;
    if (!crypto) {
        throw new Error('Web Crypto API is not available');
    }

    try {
        // 2. Base64解码密钥（43位base64字符串 -> 32字节AES密钥）
        const decodedKey = Buffer.from(key, 'base64');
        if (decodedKey.length !== 32) {
            throw new Error(`Invalid key length: expected 32 bytes, got ${decodedKey.length}`);
        }

        // 3. Base64解码加密文本
        const decodedText = Buffer.from(encryptedText, 'base64');
        if (decodedText.length === 0) {
            throw new Error('Decoded encrypted text is empty');
        }

        // 4. 从密钥前16字节生成IV（初始化向量）
        const iv = decodedKey.subarray(0, 16);

        // 5. 导入AES密钥
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            decodedKey,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );

        // 6. 执行AES-CBC解密
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv },
            cryptoKey,
            decodedText
        );

        if (decrypted.byteLength === 0) {
            throw new Error('Decrypted data is empty');
        }

        // 7. 解码为UTF-8字符串
        const result = new Uint8Array(decrypted);
        
        // 8. 移除PKCS7填充（如果存在）
        // 腾讯会议使用标准的AES-CBC + PKCS7填充
        let unpaddedResult = result;
        const paddingLength = result[result.length - 1];
        if (paddingLength > 0 && paddingLength <= 16) {
            // 验证填充是否有效
            let isValidPadding = true;
            for (let i = 0; i < paddingLength; i++) {
                if (result[result.length - 1 - i] !== paddingLength) {
                    isValidPadding = false;
                    break;
                }
            }
            if (isValidPadding) {
                unpaddedResult = result.subarray(0, result.length - paddingLength);
            }
        }

        // 9. 转换为UTF-8字符串
        const decoded = new TextDecoder('utf-8').decode(unpaddedResult);
        
        return decoded;
        
    } catch (error) {
        // 提供更详细的错误信息
        if (error.name === 'OperationError') {
            throw new Error(`Decryption failed: ${error.message}. Please check if the encodingAesKey is correct.`);
        }
        throw new Error(`AES decryption failed: ${error.message}`);
    }
}

/**
 * 验证腾讯会议Webhook URL
 * @param checkStr 待验证的字符串（已URL解码）
 * @param timestamp 时间戳（已URL解码）
 * @param nonce 随机数（已URL解码）
 * @param signature 签名（已URL解码）
 * @param token 配置的Token
 * @param encodingAesKey 编码AES密钥
 * @returns 解密后的明文
 */
export async function verifyWebhookUrl(
    checkStr: string,
    timestamp: string,
    nonce: string,
    signature: string,
    token: string,
    encodingAesKey: string
): Promise<string> {
    try {
        // 1. 参数校验
        if (!checkStr || !timestamp || !nonce || !signature) {
            throw new WebhookUrlVerificationException(
                'TENCENT_MEETING',
                'Missing required parameters for URL verification'
            );
        }

        // 2. 签名验证（使用已解码的参数）
        const isValid = verifySignature(
            token,
            timestamp,
            nonce,
            checkStr, // 使用已解码的checkStr
            signature
        );

        if (!isValid) {
            throw new WebhookSignatureVerificationException(
                'TENCENT_MEETING'
            );
        }

        // 3. 解密check_str
        const decryptedStr = await aesDecrypt(checkStr, encodingAesKey);

        return decryptedStr;
    } catch (error) {
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
 * 生成腾讯会议API请求签名
 * @param secretKey 密钥
 * @param httpMethod HTTP方法
 * @param secretId 密钥ID
 * @param headerNonce 随机数
 * @param headerTimestamp 时间戳
 * @param requestUri 请求URI
 * @param requestBody 请求体
 * @returns Base64编码的签名
 */
export function generateSignature(
    secretKey: string,
    httpMethod: string,
    secretId: string,
    headerNonce: string,
    headerTimestamp: string,
    requestUri: string,
    requestBody: string
): string {
    const headerString = `X-TC-Key=${secretId}&X-TC-Nonce=${headerNonce}&X-TC-Timestamp=${headerTimestamp}`;
    const stringToSign = `${httpMethod}\n${headerString}\n${requestUri}\n${requestBody}`;

    // 2. 使用HMAC-SHA256计算签名
    const hmac = createHmac('sha256', secretKey);
    const hash = hmac.update(stringToSign).digest('hex'); // 先获取十六进制字符串
    return Buffer.from(hash).toString('base64'); // 再进行base64编码
}