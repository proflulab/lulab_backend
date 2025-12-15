/**
 * 数据库种子数据主协调脚本
 *
 * 功能：
 * - 初始化数据库种子数据
 * - 清理数据库数据
 * - 删除所有表结构
 * - 分析数据库结构
 * - 重置数据库（清理+初始化）
 *
 * @author 杨仕明 shiming.y@qq.com
 * @copyright 2025
 */

import { PrismaClient } from '@prisma/client';
import {
  createUsers,
  createPermissions,
  createOrganization,
  createDepartments,
  createUserDepartmentRelations,
  createChannels,
  createProjects,
  createCurriculums,
  createProducts,
  createOrders,
  createRefunds,
  createMeetings,
  createAllRelations,
} from './seeds/index';

// 全局Prisma客户端实例
const prisma = new PrismaClient();

// ==================== 类型定义 ====================

/**
 * 数据库表依赖关系映射
 */
type TableDependencies = Map<string, string[]>;

/**
 * 数据库操作选项
 */
interface DatabaseOperationOptions {
  force?: boolean;
}

// ==================== 工具函数 ====================

/**
 * 将表名转换为PascalCase（用于Prisma模型名）
 * @example user_profiles -> UserProfiles
 */
function toPascalCase(str: string): string {
  return str.replace(/(^\w|_\w)/g, (match) =>
    match.replace('_', '').toUpperCase(),
  );
}

/**
 * 将表名转换为camelCase（用于Prisma客户端属性名）
 * @example user_profiles -> userProfiles
 */
function toCamelCase(str: string): string {
  const pascalCase = toPascalCase(str);
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

/**
 * 检查Prisma客户端是否有对应的模型
 */
function hasPrismaModel(prisma: PrismaClient, modelName: string): boolean {
  try {
    return (prisma as any)[toCamelCase(modelName)] !== undefined;
  } catch {
    return false;
  }
}

/**
 * 读取用户输入（用于确认操作）
 */
async function readUserInput(prompt: string): Promise<string> {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ==================== 数据库分析工具 ====================

/**
 * 获取数据库中所有表名（按依赖关系排序）
 */
async function getAllTables(): Promise<string[]> {
  try {
    console.log('📋 正在获取数据库表名...');
    const result = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;

    const tables = result.map((row) => row.tablename);
    console.log(`📊 发现 ${tables.length} 个表:`, tables);
    return tables;
  } catch (error) {
    console.error('❌ 获取表名失败:', error);
    throw error;
  }
}

/**
 * 分析表之间的依赖关系（基于外键约束）
 */
async function analyzeTableDependencies(): Promise<TableDependencies> {
  try {
    console.log('🔍 正在分析表依赖关系...');
    const dependencies = new Map<string, string[]>();

    // 查询所有外键约束
    const foreignKeys = await prisma.$queryRaw<
      Array<{
        table_name: string;
        foreign_table_name: string;
      }>
    >`
      SELECT 
        tc.table_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_schema = 'public'
    `;

    // 构建依赖关系图
    for (const fk of foreignKeys) {
      if (!dependencies.has(fk.table_name)) {
        dependencies.set(fk.table_name, []);
      }
      dependencies.get(fk.table_name)!.push(fk.foreign_table_name);
    }

    console.log('✅ 表依赖关系分析完成');
    return dependencies;
  } catch (error) {
    console.error('❌ 分析表依赖关系失败:', error);
    throw error;
  }
}

/**
 * 拓扑排序：按依赖关系排序表（依赖的表排在前面）
 * @param tables 要排序的表名列表
 * @param dependencies 表依赖关系映射
 * @returns 按依赖关系排序后的表名列表（依赖的表先删除）
 */
function topologicalSort(
  tables: string[],
  dependencies: TableDependencies,
): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(table: string) {
    if (visited.has(table)) return;

    visited.add(table);

    // 先访问依赖的表
    const deps = dependencies.get(table) || [];
    for (const dep of deps) {
      if (tables.includes(dep)) {
        visit(dep);
      }
    }

    // 再添加当前表
    result.push(table);
  }

  // 对所有表进行访问
  for (const table of tables) {
    visit(table);
  }

  return result.reverse(); // 反转得到删除顺序（依赖的表先删除）
}

// ==================== 数据库清理操作 ====================

/**
 * 清理数据库所有数据（自动获取表名并按依赖关系排序）
 * 使用拓扑排序确保按正确的顺序删除数据，避免外键约束错误
 */
async function cleanDatabase(): Promise<void> {
  console.log('🧹 开始自动清理数据库...');

  try {
    // 1. 获取所有表名
    const allTables = await getAllTables();

    if (allTables.length === 0) {
      console.log('ℹ️ 数据库中没有表需要清理');
      return;
    }

    // 2. 分析表之间的依赖关系
    const dependencies = await analyzeTableDependencies();

    // 3. 按依赖关系排序（依赖的表先删除）
    const sortedTables = topologicalSort(allTables, dependencies);
    console.log('📊 按依赖关系排序后的清理顺序:', sortedTables);

    // 4. 按顺序清理每个表的数据
    console.log('\n🗑️ 开始清理表数据...');
    let cleanedCount = 0;

    for (const table of sortedTables) {
      try {
        await cleanupTableData(table);
        cleanedCount++;
      } catch (error) {
        console.warn(`⚠️ 清理表 ${table} 时出现警告:`, error);
        // 继续清理其他表，不中断整个流程
      }
    }

    console.log(
      `\n🎉 数据库清理完成！共清理 ${cleanedCount}/${sortedTables.length} 个表`,
    );
  } catch (error) {
    console.error('❌ 数据库清理失败:', error);
    throw error;
  }
}

/**
 * 清理单个表的数据
 * 优先使用Prisma模型，如果没有则使用原生SQL
 */
async function cleanupTableData(table: string): Promise<void> {
  const modelName = toPascalCase(table);

  // 检查Prisma客户端是否有对应的方法
  if (hasPrismaModel(prisma, modelName)) {
    await (prisma as any)[toCamelCase(modelName)].deleteMany({});
    console.log(`✅ 已清理表数据: ${table}`);
  } else {
    // 如果没有对应的Prisma模型，使用原生SQL
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    console.log(`✅ 已清理表数据（SQL）: ${table}`);
  }
}

/**
 * 删除所有表结构（动态获取表名并按依赖关系排序）
 * @param options 操作选项
 * @param options.force 是否强制删除（生产环境需要显式确认）
 */
async function dropAllTables(
  options: DatabaseOperationOptions = {},
): Promise<void> {
  const { force = false } = options;

  // 生产环境安全检查
  if (!force && process.env.NODE_ENV === 'production') {
    throw new Error('生产环境下删除表需要显式确认，请使用 force: true 参数');
  }

  try {
    // 1. 获取所有表名和依赖关系
    const allTables = await getAllTables();

    if (allTables.length === 0) {
      console.log('ℹ️ 数据库中没有表需要删除');
      return;
    }

    const dependencies = await analyzeTableDependencies();
    const sortedTables = topologicalSort(allTables, dependencies);

    // 2. 用户确认（非强制模式）
    await confirmDropOperation(sortedTables, force);

    // 3. 按顺序删除表
    console.log('\n🗑️ 开始动态删除表结构...');
    for (const table of sortedTables) {
      try {
        await prisma.$executeRawUnsafe(
          `DROP TABLE IF EXISTS "${table}" CASCADE;`,
        );
        console.log(`✅ 已删除表: ${table}`);
      } catch (error) {
        console.warn(`⚠️ 删除表 ${table} 时出现警告:`, error);
      }
    }

    console.log('🎉 表结构删除完成！');
  } catch (error) {
    console.error('❌ 删除表结构失败:', error);
    throw error;
  }
}

/**
 * 确认删除操作
 */
async function confirmDropOperation(
  tables: string[],
  force: boolean,
): Promise<void> {
  console.log('\n⚠️  ⚠️  ⚠️  警告 ⚠️  ⚠️  ⚠️');
  console.log('即将删除上述所有表，此操作不可恢复！');
  console.log(`将删除 ${tables.length} 个表: ${tables.join(', ')}`);

  // 非强制模式下要求用户确认
  if (!force) {
    const confirmation = await readUserInput(
      '\n请输入 "DELETE" 确认删除操作，或直接回车取消: ',
    );

    if (confirmation !== 'DELETE') {
      console.log('❌ 用户取消删除操作');
      throw new Error('用户取消删除操作');
    }
  }
}

/**
 * 重置数据库：先清理再初始化
 */
async function resetDatabase(): Promise<void> {
  console.log('🔄 开始重置数据库...');

  try {
    // 1. 清理现有数据
    await cleanDatabase();

    // 2. 重新初始化数据
    await seedDatabase();

    console.log('🎉 数据库重置完成！');
  } catch (error) {
    console.error('❌ 数据库重置失败:', error);
    throw error;
  }
}

// ==================== 种子数据初始化 ====================

/**
 * 初始化种子数据
 */
async function seedDatabase(): Promise<void> {
  console.log('🚀 开始数据库种子数据初始化...');

  try {
    // 步骤 1: 创建基础数据结构
    const {
      userData,
      permissionData,
      organizationData,
      channelData,
      projectData,
      curriculumData,
      productData,
    } = await createBasicData();

    // 步骤 2: 创建业务数据
    const { orders, refunds } = await createBusinessData(
      userData,
      productData,
      channelData,
    );

    // 步骤 3: 创建会议数据
    console.log('\n🎯 步骤 3: 创建会议数据');
    const meetingData = await createMeetings(prisma, userData.adminUser.id);

    // 输出统计信息
    printSeedStatistics(
      userData,
      permissionData,
      organizationData,
      channelData,
      projectData,
      curriculumData,
      productData,
      orders,
      refunds,
      meetingData,
    );
  } catch (error) {
    console.error('❌ 种子数据初始化失败:', error);
    throw error;
  }
}

/**
 * 创建基础数据结构
 */
async function createBasicData() {
  // 1. 创建用户和基础角色
  console.log('\n📝 步骤 1: 创建用户和基础角色');
  const userData = await createUsers(prisma);

  // 2. 创建权限和完整角色体系
  console.log('\n🔐 步骤 2: 创建权限和完整角色体系');
  const permissionData = await createPermissions(prisma);

  // 3. 创建组织和部门结构
  console.log('\n🏢 步骤 3: 创建组织和部门结构');
  const organization = await createOrganization(prisma);
  const departments = await createDepartments(prisma, organization.id);
  const organizationData = { organization, departments };

  // 3.1 创建用户部门关联
  console.log('\n🔗 步骤 3.1: 创建用户部门关联');
  await createUserDepartmentRelations(prisma, departments, userData);

  // 3.2 创建其他关联表数据
  console.log('\n🔗 步骤 3.2: 创建关联表数据');
  await createAllRelations(prisma, organization.id, userData);

  // 4. 创建渠道数据
  console.log('\n📺 步骤 4: 创建渠道数据');
  const channelData = await createChannels(prisma);

  // 5. 创建项目数据
  console.log('\n📚 步骤 5: 创建项目数据');
  const projectData = await createProjects(prisma);

  // 6. 创建课程数据
  console.log('\n📖 步骤 6: 创建课程数据');
  const curriculumData = await createCurriculums(prisma, {
    projects: projectData.projects,
  });

  // 7. 创建产品数据
  console.log('\n📦 步骤 7: 创建产品数据');
  const productData = await createProducts(prisma, userData.adminUser);

  return {
    userData,
    permissionData,
    organizationData,
    channelData,
    projectData,
    curriculumData,
    productData,
  };
}

/**
 * 创建业务数据（订单、退款等）
 */
async function createBusinessData(
  userData: any,
  productData: any,
  channelData: any,
) {
  // 8. 创建订单数据
  console.log('\n🛒 步骤 8: 创建订单数据');
  const orders = await createOrders(prisma, {
    users: userData,
    products: productData.products,
    channels: channelData.channels,
  });

  // 9. 创建退款数据
  console.log('\n💰 步骤 9: 创建退款数据');
  const refunds = await createRefunds(prisma, {
    users: userData,
    orders: orders,
  });

  return { orders, refunds };
}

/**
 * 打印种子数据统计信息
 */
function printSeedStatistics(
  userData: any,
  permissionData: any,
  organizationData: any,
  channelData: any,
  projectData: any,
  curriculumData: any,
  productData: any,
  orders: any[],
  refunds: any[],
  meetingData?: any,
): void {
  console.log('\n✅ 数据库种子数据初始化完成！');
  console.log('\n📊 统计信息:');
  console.log(`👥 用户: ${userData.normalUsers.length + 3} 个`);
  console.log(`🎭 角色: ${Object.keys(permissionData.roles).length} 个`);
  console.log(`🔑 权限: ${permissionData.permissions.length} 个`);
  console.log(`🏢 组织: 1 个`);
  console.log(
    `🏬 部门: ${Object.keys(organizationData.departments).length} 个`,
  );
  console.log(`📺 渠道: ${channelData.channels.length} 个`);
  console.log(`📚 项目: ${projectData.projects.length} 个`);
  console.log(`📖 课程: ${curriculumData.curriculums.length} 个`);
  console.log(`📦 产品: ${productData.products.length} 个`);
  console.log(`🛒 订单: ${orders.length} 个`);
  console.log(`💰 退款: ${refunds.length} 个`);

  if (meetingData) {
    console.log(`🎯 会议: ${Object.keys(meetingData.meetings).length} 个`);
    console.log(
      `👥 平台用户: ${Object.keys(meetingData.platformUsers).length} 个`,
    );
    console.log(
      `📁 会议文件: ${Object.keys(meetingData.meetingFiles).length} 个`,
    );
    console.log(
      `📝 会议总结: ${Object.keys(meetingData.meetingSummaries).length} 个`,
    );
  }
}

// ==================== 数据库分析功能 ====================

/**
 * 分析数据库表结构（调试用）
 */
async function analyzeDatabase(): Promise<void> {
  console.log('🔍 正在分析数据库结构...');

  try {
    // 获取所有表名
    const allTables = await getAllTables();

    // 分析依赖关系
    const dependencies = await analyzeTableDependencies();
    printTableDependencies(dependencies);

    // 计算拓扑排序
    const sortedTables = topologicalSort(allTables, dependencies);
    printTableDeletionOrder(sortedTables);

    console.log('\n✅ 数据库结构分析完成！');
  } catch (error) {
    console.error('❌ 分析数据库结构失败:', error);
    throw error;
  }
}

/**
 * 打印表依赖关系
 */
function printTableDependencies(dependencies: TableDependencies): void {
  console.log('\n🔗 表依赖关系:');
  for (const entry of Array.from(dependencies.entries())) {
    const [table, deps] = entry;
    console.log(`  ${table} -> [${deps.join(', ')}]`);
  }
}

/**
 * 打印表删除顺序
 */
function printTableDeletionOrder(sortedTables: string[]): void {
  console.log('\n📋 建议的删除顺序:');
  sortedTables.forEach((table, index) => {
    console.log(`  ${index + 1}. ${table}`);
  });
}

// ==================== 主程序入口 ====================

/**
 * 命令行参数解析
 */
function parseCommandLineArgs(): { command: string; force: boolean } {
  const args = process.argv.slice(2);
  const command = args[0] || 'seed';
  const force = process.argv.includes('--force');

  return { command, force };
}

/**
 * 执行数据库操作
 */
async function executeDatabaseOperation(
  command: string,
  force: boolean,
): Promise<void> {
  switch (command) {
    case 'clean':
      await cleanDatabase();
      break;

    case 'drop':
      await dropAllTables({ force });
      break;

    case 'analyze':
      await analyzeDatabase();
      break;

    case 'reset':
      await resetDatabase();
      break;

    case 'seed':
    default:
      await seedDatabase();
      break;
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const { command, force } = parseCommandLineArgs();

  try {
    console.log(`🚀 执行命令: ${command}`);
    await executeDatabaseOperation(command, force);
    console.log(`✅ 命令 ${command} 执行完成！`);
  } catch (error) {
    console.error(`❌ 命令 ${command} 执行失败:`, error);
    throw error;
  }
}

// ==================== 程序入口 ====================

// 导出函数以便在其他模块中使用
export {
  cleanDatabase,
  dropAllTables,
  resetDatabase,
  seedDatabase,
  analyzeDatabase,
};

// 如果直接运行此文件，则执行main函数
if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

/**
 * 使用说明:
 *
 * 1. 初始化种子数据（默认）:
 *    npx tsx prisma/seed.ts
 *    npx tsx prisma/seed.ts seed
 *
 * 2. 清理数据库:
 *    npx tsx prisma/seed.ts clean
 *    - 自动发现所有数据库表
 *    - 分析表之间的外键依赖关系
 *    - 按正确的顺序清理数据，避免外键约束错误
 *
 * 3. 删除所有表结构:
 *    npx tsx prisma/seed.ts drop
 *    npx tsx prisma/seed.ts drop --force  # 强制删除（生产环境）
 *    - 会显示将要删除的表列表
 *    - 需要输入 "DELETE" 确认操作（非强制模式）
 *
 * 4. 分析数据库结构:
 *    npx tsx prisma/seed.ts analyze
 *
 * 5. 重置数据库（清理 + 初始化）:
 *    npx tsx prisma/seed.ts reset
 *
 * ⚠️ 注意：清理和重置操作会删除所有数据，请谨慎使用！
 */
