/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-20 08:48:13
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-20 09:26:42
 * @FilePath: /lulab_backend/docs/developer/modules/hook-tencent-mtg/tencent-meeting-webhook-post-event-postman-pre-script.js
 * @Description: 腾讯会议Webhook事件POST请求 - Postman前置脚本
 * // 腾讯会议Webhook事件POST请求 - Postman前置脚本 
 * // 用于测试 /webhooks/tencent POST 端点 
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved. 
 */


const CryptoJS = require('crypto-js'); 

// 配置参数 - 请根据您的实际配置修改这些值 
const config = { 
    // 腾讯会议Webhook配置 
    token: pm.environment.get("TENCENT_MEETING_TOKEN") || "your_webhook_token_here", 
    encodingAesKey: pm.environment.get("TENCENT_MEETING_ENCODING_AES_KEY") || "your_encoding_aes_key_here", 

    // 生成随机参数 
    timestamp: Date.now().toString(), 
    nonce: Math.floor(10000000 + Math.random() * 90000000).toString(), 

    // 事件类型 - 可以修改为其他事件类型
    eventType: pm.environment.get("TENCENT_MEETING_EVENT_TYPE") || "meeting.end"
}; 

// 计算签名的函数 
function calculateSignature(token, timestamp, nonce, data) { 
    // 按字典序排序参数 
    const params = [token, timestamp, nonce, data].sort(); 
    const concatenatedString = params.join(''); 

    // 计算SHA1哈希 
    const signature = CryptoJS.SHA1(concatenatedString).toString(); 
    return signature; 
} 

// 腾讯会议兼容的AES加密函数 
function encryptTextTencentStyle(plainText, encodingAesKey) { 
    try { 
        // 1. 解码EncodingAESKey（添加"="填充） 
        const decodedKey = CryptoJS.enc.Base64.parse(encodingAesKey + '='); 
        
        // 2. 从密钥的前16字节提取IV 
        const iv = CryptoJS.lib.WordArray.create(decodedKey.words.slice(0, 4)); // 16字节 = 4个32位字 
        
        // 3. 使用AES-256-CBC加密 
        const encrypted = CryptoJS.AES.encrypt(plainText, decodedKey, { 
            iv: iv, 
            mode: CryptoJS.mode.CBC, 
            padding: CryptoJS.pad.Pkcs7 
        }); 
        
        return encrypted.toString(); 
    } catch (error) { 
        console.error("加密失败:", error); 
        return null; 
    } 
} 

// 生成测试事件数据
function generateTestEvent(eventType) {
    const currentTimestamp = Math.floor(Date.now() / 1000); // 秒级时间戳
    
    // 根据事件类型生成不同的测试数据
    const baseEvent = {
        event: eventType,
        trace_id: "trace_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        payload: [
            {
                operate_time: Date.now(), // 毫秒级时间戳
                operator: {
                    userid: "test_user_123",
                    uuid: "user_uuid_123",
                    user_name: "测试用户",
                    instance_id: "1" // PC端
                },
                meeting_info: {
                    meeting_id: "123456789",
                    meeting_code: "123-456-789",
                    subject: "测试会议",
                    creator: {
                        userid: "creator_123",
                        uuid: "creator_uuid_123",
                        user_name: "会议创建者"
                    },
                    meeting_type: 0, // 一次性会议
                    start_time: currentTimestamp - 3600, // 1小时前开始
                    end_time: currentTimestamp + 3600 // 1小时后结束
                }
            }
        ]
    };
    
    // 根据事件类型添加特定字段
    if (eventType === "meeting.end") {
        baseEvent.payload[0].meeting_end_type = 0; // 主动结束会议
    }
    
    if (eventType === "recording.ready") {
        baseEvent.payload[0].recording_files = [
            {
                record_file_id: "recording_file_123"
            }
        ];
    }
    
    return JSON.stringify(baseEvent);
}

// 生成事件数据
const eventData = generateTestEvent(config.eventType);

// 加密事件数据
const encryptedData = encryptTextTencentStyle(eventData, config.encodingAesKey); 

if (!encryptedData) { 
    console.error("加密失败，无法继续"); 
    return; 
} 

// 计算签名（使用原始Base64字符串，不进行URL编码）
const signature = calculateSignature(config.token, config.timestamp, config.nonce, encryptedData); 

// 设置环境变量，以便在请求中使用 
pm.environment.set("timestamp", config.timestamp); 
pm.environment.set("nonce", config.nonce); 
pm.environment.set("signature", signature); 
pm.environment.set("encrypted_data", encryptedData); 

const { token, encodingAesKey } = config; 
console.log("token:", token); 
console.log("encodingAesKey:", encodingAesKey); 

console.log("腾讯会议Webhook事件POST请求参数已生成:"); 
console.log("事件类型:", config.eventType); 
console.log("时间戳:", config.timestamp); 
console.log("随机数:", config.nonce); 
console.log("事件数据(明文):", eventData); 
console.log("事件数据(加密):", encryptedData); 
console.log("签名:", signature);

// 设置请求体
// 注意：在Postman请求的Body选项卡中，需要选择raw和JSON格式
// 然后使用以下JSON作为请求体：
// {
//     "data": "{{encrypted_data}}"
// }
// 或者使用Pre-request Script自动设置：
// pm.request.body.update(JSON.stringify({
//     data: encryptedData
// }));