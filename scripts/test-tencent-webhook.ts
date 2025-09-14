#!/usr/bin/env node

/**
 * 腾讯会议Webhook测试脚本
 * 用于验证webhook处理逻辑是否正确
 */

import axios from 'axios';
import * as crypto from 'crypto';

// 测试配置
const config = {
  baseUrl: 'http://localhost:3000',
  webhookPath: '/webhooks/tencent',
  token: 'test_token_123',
  encodingAesKey: 'test_encoding_aes_key_32bytes_length_1234567890ab',
};

/**
 * 生成签名
 */
function generateSignature(token: string, timestamp: string, nonce: string, data: string): string {
  const arr = [token, timestamp, nonce, data].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1');
  return sha1.update(str).digest('hex');
}

/**
 * 加密数据（模拟腾讯会议的加密方式）
 */
function encryptData(data: string, key: string): string {
  // 简单模拟加密 - 实际应使用AES-CBC + PKCS7填充
  return Buffer.from(data).toString('base64');
}

/**
 * 测试URL验证
 */
async function testUrlVerification() {
  console.log('🧪 测试URL验证...');

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = '123456';
  const checkStr = Buffer.from('test_verification_string').toString('base64');
  const signature = generateSignature(config.token, timestamp, nonce, checkStr);

  try {
    const response = await axios.get(`${config.baseUrl}${config.webhookPath}`, {
      params: {
        check_str: checkStr,
        timestamp,
        nonce,
        signature
      }
    });

    console.log('✅ URL验证成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ URL验证失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试事件回调
 */
async function testEventCallback() {
  console.log('🧪 测试事件回调...');

  const eventData = {
    event: 'meeting.created',
    trace_id: 'test-trace-id-123',
    payload: [{
      operate_time: Date.now(),
      operator: {
        userid: 'test_user_123',
        user_name: '测试用户'
      },
      meeting_info: {
        meeting_id: 'test_meeting_123',
        meeting_code: '123456789',
        subject: '测试会议',
        creator: {
          userid: 'test_user_123',
          user_name: '测试用户'
        },
        meeting_type: 0,
        start_time: Math.floor(Date.now() / 1000) + 3600,
        end_time: Math.floor(Date.now() / 1000) + 7200
      }
    }]
  };

  const jsonData = JSON.stringify(eventData);
  const encryptedData = encryptData(jsonData, config.encodingAesKey);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = '654321';
  const signature = generateSignature(config.token, timestamp, nonce, encryptedData);

  try {
    const response = await axios.post(`${config.baseUrl}${config.webhookPath}`, {
      data: encryptedData
    }, {
      headers: {
        'Content-Type': 'application/json',
        'timestamp': timestamp,
        'nonce': nonce,
        'signature': signature
      }
    });

    if (response.data === 'successfully received callback') {
      console.log('✅ 事件回调成功');
      return true;
    } else {
      console.error('❌ 事件回调响应格式错误:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 事件回调失败:', error.response?.data || error.message);
    return false;
  }
}



/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始腾讯会议Webhook测试...\n');

  let successCount = 0;
  const totalTests = 3;

  // 测试URL验证
  if (await testUrlVerification()) successCount++;
  console.log();

  // 测试事件回调
  if (await testEventCallback()) successCount++;
  console.log();



  console.log(`📊 测试结果: ${successCount}/${totalTests} 通过`);

  if (successCount === totalTests) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️  部分测试失败，请检查配置和实现');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

export { testUrlVerification, testEventCallback };