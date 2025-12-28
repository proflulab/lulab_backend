import 'dotenv/config';
import { execSync } from 'child_process';

// 系统测试环境设置
const setupSystemTests = () => {
  console.log('🚀 Setting up system test environment...');

  // 确保测试数据库可用
  const databaseUrl =
    process.env.DATABASE_URL_SYSTEM_TEST || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL_SYSTEM_TEST or DATABASE_URL must be defined');
  }

  // 重置数据库
  try {
    console.log('🔄 Resetting test database...');
    execSync('npm run db:reset -- --force', { stdio: 'inherit' });
    execSync('npm run db:seed', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to setup database:', error);
    throw error;
  }

  console.log('✅ System test environment ready');
};

// 全局设置
beforeAll(() => {
  setupSystemTests();
}, 120000);

// 全局清理
afterAll(() => {
  console.log('🧹 Cleaning up system test environment...');
  // 清理测试数据
  try {
    execSync('npm run db:clean', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️  Failed to cleanup database:', error);
  }
});
