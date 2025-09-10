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

async function validateLarkConfig() {
  console.log('🔍 验证飞书配置...\n');

  // 检查环境变量
  const requiredEnvVars = [
    'LARK_APP_ID',
    'LARK_APP_SECRET',
    'LARK_TEST_APP_TOKEN',
    'LARK_TEST_TABLE_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ 缺少环境变量:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.error('\n💡 请从飞书开放平台获取这些配置信息');
    console.error('\n📋 获取配置步骤:');
    console.error('   1. 访问 https://open.feishu.cn/');
    console.error('   2. 创建应用并获取 App ID 和 App Secret');
    console.error('   3. 创建多维表格，获取 App Token 和 Table ID');
    console.error('   4. 配置权限: 多维表格、记录管理权限');
    process.exit(1);
  }

  console.log('✅ 环境变量检查通过');
  console.log(`   LARK_APP_ID: ${process.env.LARK_APP_ID?.substring(0, 8)}...`);
  console.log(`   LARK_TEST_APP_TOKEN: ${process.env.LARK_TEST_APP_TOKEN?.substring(0, 8)}...`);
  console.log(`   LARK_TEST_TABLE_ID: ${process.env.LARK_TEST_TABLE_ID}\n`);

  // 测试API连接
  try {
    const token = await getAccessToken();
    
    if (!token) {
      console.error('❌ 无法获取访问令牌');
      console.error('💡 请检查 LARK_APP_ID 和 LARK_APP_SECRET 是否正确');
      process.exit(1);
    }

    console.log('✅ 访问令牌获取成功');
    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    // 测试多维表格访问
    console.log('🔍 测试多维表格访问...');
    const appToken = process.env.LARK_TEST_APP_TOKEN;
    const tableId = process.env.LARK_TEST_TABLE_ID;

    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 多维表格访问成功');
      console.log(`   表格名称: ${data.data?.name}`);
      console.log(`   表格ID: ${data.data?.table_id}`);
      
      // 获取表格字段信息
      console.log('\n🔍 获取表格字段信息...');
      const fieldsResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        console.log('✅ 字段信息获取成功');
        console.log('   可用字段:');
        fieldsData.data?.items?.forEach((field) => {
          console.log(`     - ${field.field_name} (${field.type})`);
        });
        
        // 检查测试所需字段
        const requiredFields = ['测试文本', '测试数字', '测试布尔', '测试日期'];
        const missingFields = requiredFields.filter(field => 
          !fieldsData.data?.items?.some((f) => f.field_name === field)
        );
        
        if (missingFields.length > 0) {
          console.warn('\n⚠️  缺少测试所需字段:');
          missingFields.forEach(field => console.warn(`   - ${field}`));
          console.warn('\n💡 请在测试表格中添加这些字段或修改测试代码');
        } else {
          console.log('\n✅ 所有测试所需字段都已存在');
        }
      }
    } else {
      console.error('❌ 多维表格访问失败');
      console.error(`   状态码: ${response.status}`);
      const errorText = await response.text();
      console.error(`   错误: ${errorText}`);
      
      if (response.status === 400) {
        console.error('\n💡 可能的原因:');
        console.error('   - app_token 或 table_id 不正确');
        console.error('   - 应用没有多维表格权限');
        console.error('   - IP白名单未配置');
      }
    }

  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }

  console.log('\n🎉 配置验证完成！');
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

validateLarkConfig().catch(console.error);