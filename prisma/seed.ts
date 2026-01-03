/**
 * 数据库种子数据脚本
 *
 * 使用方法:
 * - npx tsx prisma/seed.ts          # 初始化种子数据
 * - npx tsx prisma/seed.ts clean    # 清理数据库数据
 * - npx tsx prisma/seed.ts drop     # 删除所有表结构
 * - npx tsx prisma/seed.ts reset    # 重置数据库（清理+初始化）
 * - npx tsx prisma/seed.ts analyze  # 分析数据库结构
 *
 * @author 杨仕明 shiming.y@qq.com
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
  createParticipantSummaries,
} from './seeds/index';

const prisma = new PrismaClient();

type TableDependencies = Map<string, string[]>;

interface DatabaseOperationOptions {
  force?: boolean;
}

function toPascalCase(str: string): string {
  return str.replace(/(^\w|_\w)/g, (match) =>
    match.replace('_', '').toUpperCase(),
  );
}

function toCamelCase(str: string): string {
  const pascalCase = toPascalCase(str);
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

function hasPrismaModel(prisma: PrismaClient, modelName: string): boolean {
  try {
    return (prisma as any)[toCamelCase(modelName)] !== undefined;
  } catch {
    return false;
  }
}

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

async function getAllTables(): Promise<string[]> {
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
}

async function analyzeTableDependencies(): Promise<TableDependencies> {
  console.log('🔍 正在分析表依赖关系...');
  const dependencies = new Map<string, string[]>();

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

  for (const fk of foreignKeys) {
    if (!dependencies.has(fk.table_name)) {
      dependencies.set(fk.table_name, []);
    }
    dependencies.get(fk.table_name)!.push(fk.foreign_table_name);
  }

  console.log('✅ 表依赖关系分析完成');
  return dependencies;
}

function topologicalSort(
  tables: string[],
  dependencies: TableDependencies,
): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(table: string) {
    if (visited.has(table)) return;

    visited.add(table);

    const deps = dependencies.get(table) || [];
    for (const dep of deps) {
      if (tables.includes(dep)) {
        visit(dep);
      }
    }

    result.push(table);
  }

  for (const table of tables) {
    visit(table);
  }

  return result.reverse();
}

async function cleanupTableData(table: string): Promise<void> {
  const modelName = toPascalCase(table);

  if (hasPrismaModel(prisma, modelName)) {
    await (prisma as any)[toCamelCase(modelName)].deleteMany({});
    console.log(`✅ 已清理表数据: ${table}`);
  } else {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    console.log(`✅ 已清理表数据（SQL）: ${table}`);
  }
}

async function cleanDatabase(): Promise<void> {
  console.log('🧹 开始自动清理数据库...');

  try {
    const allTables = await getAllTables();

    if (allTables.length === 0) {
      console.log('ℹ️ 数据库中没有表需要清理');
      return;
    }

    const dependencies = await analyzeTableDependencies();
    const sortedTables = topologicalSort(allTables, dependencies);
    console.log('📊 按依赖关系排序后的清理顺序:', sortedTables);

    console.log('\n🗑️ 开始清理表数据...');
    let cleanedCount = 0;

    for (const table of sortedTables) {
      try {
        await cleanupTableData(table);
        cleanedCount++;
      } catch (error) {
        console.warn(`⚠️ 清理表 ${table} 时出现警告:`, error);
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

async function confirmDropOperation(
  tables: string[],
  force: boolean,
): Promise<void> {
  console.log('\n⚠️  ⚠️  ⚠️  警告 ⚠️  ⚠️  ⚠️');
  console.log('即将删除上述所有表，此操作不可恢复！');
  console.log(`将删除 ${tables.length} 个表: ${tables.join(', ')}`);

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

async function dropAllTables(
  options: DatabaseOperationOptions = {},
): Promise<void> {
  const { force = false } = options;

  if (!force && process.env.NODE_ENV === 'production') {
    throw new Error('生产环境下删除表需要显式确认，请使用 force: true 参数');
  }

  try {
    const allTables = await getAllTables();

    if (allTables.length === 0) {
      console.log('ℹ️ 数据库中没有表需要删除');
      return;
    }

    const dependencies = await analyzeTableDependencies();
    const sortedTables = topologicalSort(allTables, dependencies);

    await confirmDropOperation(sortedTables, force);

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

async function seedDatabase(): Promise<void> {
  console.log('🚀 开始数据库种子数据初始化...');

  try {
    const {
      userData,
      permissionData,
      organizationData,
      channelData,
      projectData,
      curriculumData,
      productData,
    } = await createBasicData();

    const { orders, refunds } = await createBusinessData(
      userData,
      productData,
      channelData,
    );

    console.log('\n🎯 步骤 3: 创建会议数据');
    const meetingData = await createMeetings(prisma);

    // 步骤 4: 创建参与者总结数据
    console.log('\n📝 步骤 4: 创建参与者总结数据');
    const participantSummaryData = await createParticipantSummaries(
      prisma,
      meetingData,
    );

    // 步骤 4: 创建参与者总结数据
    console.log('\n📝 步骤 4: 创建参与者总结数据');
    const participantSummaryData = await createParticipantSummaries(
      prisma,
      meetingData,
    );

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
      participantSummaryData,
    );
  } catch (error) {
    console.error('❌ 种子数据初始化失败:', error);
    throw error;
  }
}

async function createBasicData() {
  console.log('\n🔑 步骤 1: 创建权限和完整角色体系');
  const permissionData = await createPermissions(prisma);

  console.log('\n👥 步骤 2: 创建用户并分配角色');
  const userData = await createUsers(prisma, permissionData.roles);

  console.log('\n🏢 步骤 3: 创建组织和部门结构');
  const organization = await createOrganization(prisma);
  const departments = await createDepartments(prisma, organization.id);
  const organizationData = { organization, departments };

  console.log('\n🔗 步骤 3.1: 创建用户部门关联');
  await createUserDepartmentRelations(prisma, departments, userData);

  console.log('\n🔗 步骤 3.2: 创建关联表数据');
  await createAllRelations(
    prisma,
    organization.id,
    userData,
    permissionData.roles,
  );

  console.log('\n📺 步骤 4: 创建渠道数据');
  const channelData = await createChannels(prisma);

  console.log('\n📚 步骤 5: 创建项目数据');
  const projectData = await createProjects(prisma);

  console.log('\n📖 步骤 6: 创建课程数据');
  const curriculumData = await createCurriculums(prisma, {
    projects: projectData.projects,
  });

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

async function createBusinessData(
  userData: any,
  productData: any,
  channelData: any,
) {
  console.log('\n🛒 步骤 8: 创建订单数据');
  const orders = await createOrders(prisma, {
    users: userData,
    products: productData.products,
    channels: channelData.channels,
  });

  console.log('\n💰 步骤 9: 创建退款数据');
  const refunds = await createRefunds(prisma, {
    users: userData,
    orders: orders,
  });

  return { orders, refunds };
}

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
  participantSummaryData?: any,
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
    const allTables = await getAllTables();
    const dependencies = await analyzeTableDependencies();

    console.log('\n🔗 表依赖关系:');
    for (const [table, deps] of Array.from(dependencies.entries())) {
      console.log(`  ${table} -> [${deps.join(', ')}]`);
    }

    const sortedTables = topologicalSort(allTables, dependencies);
    console.log('\n📋 建议的删除顺序:');
    sortedTables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`);
    });

    console.log('\n✅ 数据库结构分析完成！');
  } catch (error) {
    console.error('❌ 分析数据库结构失败:', error);
    throw error;
  }
}

async function resetDatabase(): Promise<void> {
  console.log('� 开始重置数据库...');

  try {
    await cleanDatabase();
    await seedDatabase();

    console.log('🎉 数据库重置完成！');
  } catch (error) {
    console.error('❌ 数据库重置失败:', error);
    throw error;
  }
}

function parseCommandLineArgs(): { command: string; force: boolean } {
  const args = process.argv.slice(2);
  const command = args[0] || 'seed';
  const force = process.argv.includes('--force');

  return { command, force };
}

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

export {
  cleanDatabase,
  dropAllTables,
  resetDatabase,
  seedDatabase,
  analyzeDatabase,
};

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
