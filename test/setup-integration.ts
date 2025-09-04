// 集成测试设置文件
try {
  require('dotenv').config({ path: '.env.test' });
} catch (error) {
  console.warn('Warning: dotenv not available, using process.env');
}

// 设置更长的超时时间用于集成测试
jest.setTimeout(60000);

// 全局测试配置
console.log('🔧 Integration test setup complete');
console.log('Environment:', process.env.NODE_ENV || 'test');
console.log('Tencent API configured:', !!process.env.TENCENT_MEETING_SECRET_ID);