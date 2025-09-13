import { createHash, createHmac } from 'node:crypto';
import {
  WebhookSignatureVerificationException,
  WebhookUrlVerificationException,
} from '../exceptions/webhook.exceptions';

export function verifySignature(
  token: string,
  timestamp: string,
  nonce: string,
  data: string,
  signature: string,
): boolean {
  const arr = [token, timestamp, nonce, data].sort();
  const str = arr.join('');
  const sha1 = createHash('sha1');
  const computedSignature = sha1.update(str).digest('hex');
  return computedSignature === signature;
}

export async function aesDecrypt(
  encryptedText: string,
  key: string,
): Promise<string> {
  const crypto = (globalThis as typeof globalThis & { crypto?: Crypto }).crypto;
  if (!crypto) {
    throw new Error('Web Crypto API is not available');
  }

  try {
    const decodedKey = Buffer.from(key, 'base64');
    if (decodedKey.length !== 32) {
      throw new Error(
        `Invalid key length: expected 32 bytes, got ${decodedKey.length}`,
      );
    }

    const decodedText = Buffer.from(encryptedText, 'base64');
    if (decodedText.length === 0) {
      throw new Error('Decoded encrypted text is empty');
    }

    const iv = decodedKey.subarray(0, 16);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      decodedKey,
      { name: 'AES-CBC' },
      false,
      ['decrypt'],
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      cryptoKey,
      decodedText,
    );

    if (decrypted.byteLength === 0) {
      throw new Error('Decrypted data is empty');
    }

    const result = new Uint8Array(decrypted);
    let unpaddedResult = result;
    const paddingLength = result[result.length - 1];
    if (paddingLength > 0 && paddingLength <= 16) {
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

    const decoded = new TextDecoder('utf-8').decode(unpaddedResult);
    return decoded;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`AES decryption failed: ${errorMessage}`);
  }
}

export async function verifyWebhookUrl(
  checkStr: string,
  timestamp: string,
  nonce: string,
  signature: string,
  token: string,
  encodingAesKey: string,
): Promise<string> {
  try {
    if (!checkStr || !timestamp || !nonce || !signature) {
      throw new WebhookUrlVerificationException(
        'TENCENT_MEETING',
        'Missing required parameters for URL verification',
      );
    }

    const isValid = verifySignature(
      token,
      timestamp,
      nonce,
      checkStr,
      signature,
    );

    if (!isValid) {
      throw new WebhookSignatureVerificationException('TENCENT_MEETING');
    }

    const decryptedStr = await aesDecrypt(checkStr, encodingAesKey);
    return decryptedStr;
  } catch (error) {
    if (
      error instanceof WebhookSignatureVerificationException ||
      error instanceof WebhookUrlVerificationException
    ) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new WebhookUrlVerificationException(
      'TENCENT_MEETING',
      `URL verification failed: ${errorMessage}`,
    );
  }
}

export function generateSignature(
  secretKey: string,
  httpMethod: string,
  secretId: string,
  headerNonce: string,
  headerTimestamp: string,
  requestUri: string,
  requestBody: string,
): string {
  const headerString = `X-TC-Key=${secretId}&X-TC-Nonce=${headerNonce}&X-TC-Timestamp=${headerTimestamp}`;
  const stringToSign = `${httpMethod}\n${headerString}\n${requestUri}\n${requestBody}`;
  const hmac = createHmac('sha256', secretKey);
  const hash = hmac.update(stringToSign).digest('hex');
  return Buffer.from(hash).toString('base64');
}
