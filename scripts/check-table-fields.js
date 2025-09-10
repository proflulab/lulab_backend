#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 加载环境变量
const envPath = path.resolve(__dirname, '../.env.test');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

async function checkTableFields() {
  console.log('🔍 检查测试表格字段配置...\n');

  try {
    const token = await getAccessToken();
    if (!token) {
      console.error('❌ 无法获取访问令牌');
      return;
    }

    const appToken = process.env.LARK_TEST_APP_TOKEN;
    const tableId = process.env.LARK_TEST_TABLE_ID;

    console.log(`📋 检查表格: ${appToken}/${tableId}`);

    // 获取表格字段信息
    const fieldsResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (fieldsResponse.ok) {
      const fieldsData = await fieldsResponse.json();
      console.log('✅ 字段信息获取成功');
      console.log('\n📊 当前表格字段:');
      fieldsData.data?.items?.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field.field_name} (${field.type})`);
      });

      // 建议的测试字段映射
      console.log('\n💡 建议的测试字段映射:');
      const existingFields = fieldsData.data?.items?.map(f => f.field_name) || [];
      
      const fieldMappings = {
        '测试文本': findBestMatch('文本', existingFields),
        '测试数字': findBestMatch('数字', existingFields),
        '测试布尔': findBestMatch('复选框', existingFields),
        '测试日期': findBestMatch('日期', existingFields),
        '唯一标识': findBestMatch('文本', existingFields)
      };

      Object.entries(fieldMappings).forEach(([testField, realField]) => {
        if (realField) {
          console.log(`   ${testField} -> ${realField}`);
        } else {
          console.log(`   ${testField} -> ❌ 未找到匹配字段`);
        }
      });

      // 生成测试配置
      console.log('\n🔧 生成的测试配置:');
      const config = Object.entries(fieldMappings)
        .filter(([, realField]) => realField)
        .map(([testField, realField]) => `  ${testField}: "${realField}"`)
        .join(',\n');
      
      if (config) {
        console.log(`{\n${config}\n}`);
      }

    } else {
      console.error('❌ 无法获取字段信息');
      console.error(`状态码: ${fieldsResponse.status}`);
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

function findBestMatch(type, existingFields) {
  const typeMap = {
    '文本': ['文本', '多行文本', '单选', '多选'],
    '数字': ['数字', '百分比', '货币'],
    '复选框': ['复选框', '开关'],
    '日期': ['日期', '创建时间', '最后更新时间']
  };

  const candidates = typeMap[type] || [type];
  
  for (const candidate of candidates) {
    const match = existingFields.find(field => 
      field.includes(candidate) || candidate.includes(field)
    );
    if (match) return match;
  }

  // 返回第一个相同类型的字段
  return existingFields[0];
}

async function getAccessToken() {
  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;

  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return data.tenant_access_token;
  }
  
  return null;
}

if (require.main === module) {
  checkTableFields();
}

module.exports = { checkTableFields };