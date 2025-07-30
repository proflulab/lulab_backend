import { createHash, createHmac } from 'crypto';
import {
    WebhookSignatureVerificationException,
    WebhookUrlVerificationException
} from '../../../../exceptions/webhook.exceptions';

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
 * @param encryptedText base64编码的加密文本
 * @param key base64编码的密钥
 */
export async function aesDecrypt(encryptedText: string, key: string): Promise<string> {
    // 1. 导入Web Crypto API
    const crypto = globalThis.crypto;
    if (!crypto) {
        throw new Error('Web Crypto API is not available');
    }

    // 2. Base64解码密钥
    console.log('Original key:', key);
    const decodedKey = Buffer.from(key, 'base64');
    console.log('Decoded key length:', decodedKey.length);
    console.log('Decoded key:', decodedKey.toString('hex'));

    // 3. 生成32字节的AES密钥
    const aesKey = Buffer.alloc(32);
    decodedKey.copy(aesKey);
    console.log('AES key:', aesKey.toString('hex'));

    // 4. 从密钥前16字节生成IV
    const iv = aesKey.subarray(0, 16);
    console.log('IV:', iv.toString('hex'));

    // 5. Base64解码加密文本
    console.log('Encrypted text:', encryptedText);
    const decodedText = Buffer.from(encryptedText, 'base64');
    console.log('Decoded text length:', decodedText.length);
    console.log('Decoded text:', decodedText.toString('hex'));

    // 6. 导入AES密钥
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        aesKey,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
    );

    // 7. 解密
    let decrypted;
    try {
        decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv },
            cryptoKey,
            decodedText
        );
        console.log('Decryption successful');

        if (decrypted.byteLength === 0) {
            throw new Error('Decrypted data is empty');
        }
    } catch (error) {
        console.error('Decryption failed:', error);
        throw error;
    }

    // 8. 直接尝试解码为UTF-8字符串
    const result = new Uint8Array(decrypted);
    console.log('Decrypted raw bytes:', Array.from(result).map(b => b.toString(16).padStart(2, '0')).join(''));

    // 9. 尝试直接解码，如果是有效的UTF-8字符串则不需要移除填充
    try {
        const decoded = new TextDecoder().decode(result);
        console.log('Decoded result:', decoded);
        return decoded;
    } catch (error) {
        console.error('UTF-8 decoding failed:', error);
        throw error;
    }
}

/**
 * 验证腾讯会议Webhook URL
 * @param checkStr 待验证的字符串
 * @param timestamp 时间戳
 * @param nonce 随机数
 * @param signature 签名
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
        const decryptedStr = await aesDecrypt(decodeURIComponent(checkStr), encodingAesKey);

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