/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-15 20:26:06
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-27 14:26:19
 * @FilePath: /lulab_backend/prisma/prisma/seed.ts
 * @Description: 数据库种子数据主协调脚本
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { PrismaClient } from '@prisma/client'
import { createUsers } from './seeds/users'
import { createPermissions } from './seeds/permissions'
import { createOrganization } from './seeds/organization'
import { createDepartments, createUserDepartmentRelations } from './seeds/departments'
import { createAllRelations } from './seeds/relations'
import { createChannels } from './seeds/channels'
import { createProjects } from './seeds/projects'
import { createCurriculums } from './seeds/curriculums'
import { createProducts } from './seeds/products'
import { createOrders } from './seeds/orders'
import { createRefunds } from './seeds/refunds'

const prisma = new PrismaClient()

/**
 * 清理数据库所有数据并删除表结构
 * 按照外键依赖关系的逆序删除，避免外键约束错误
 */
async function cleanDatabase() {
  console.log('🧹 开始清理数据库...')

  try {
    // 第一步：按照依赖关系逆序删除数据
    // 1. 删除退款记录
    await prisma.orderRefund.deleteMany({})
    console.log('✅ 已清理退款记录')

    // 2. 删除订单
    await prisma.order.deleteMany({})
    console.log('✅ 已清理订单')

    // 3. 删除产品
    await prisma.product.deleteMany({})
    console.log('✅ 已清理产品')

    // 4. 删除课程
    await prisma.curriculum.deleteMany({})
    console.log('✅ 已清理课程')

    // 5. 删除项目
    await prisma.project.deleteMany({})
    console.log('✅ 已清理项目')

    // 6. 删除渠道
    await prisma.channel.deleteMany({})
    console.log('✅ 已清理渠道')

    // 7. 删除用户权限关联
    await prisma.userPermission.deleteMany({})
    await prisma.userDataPermission.deleteMany({})
    await prisma.userRole.deleteMany({})
    await prisma.userDepartment.deleteMany({})
    await prisma.userOrganization.deleteMany({})
    console.log('✅ 已清理用户权限关联')

    // 8. 删除角色权限关联
    await prisma.rolePermission.deleteMany({})
    await prisma.roleDataPermission.deleteMany({})
    console.log('✅ 已清理角色权限关联')

    // 9. 删除认证相关
    await prisma.authenticator.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.account.deleteMany({})
    await prisma.verificationToken.deleteMany({})
    console.log('✅ 已清理认证数据')

    // 10. 删除用户档案
    await prisma.userProfile.deleteMany({})
    console.log('✅ 已清理用户档案')

    // 11. 删除用户
    await prisma.user.deleteMany({})
    console.log('✅ 已清理用户')

    // 12. 删除部门
    await prisma.department.deleteMany({})
    console.log('✅ 已清理部门')

    // 13. 删除组织
    await prisma.organization.deleteMany({})
    console.log('✅ 已清理组织')

    // 14. 删除权限
    await prisma.permission.deleteMany({})
    console.log('✅ 已清理权限')

    // 15. 删除角色
    await prisma.role.deleteMany({})
    console.log('✅ 已清理角色')

    console.log('🎉 数据库清理完成！')
  } catch (error) {
    console.error('❌ 数据库清理失败:', error)
    throw error
  }
}

/**
 * 删除所有表结构
 * @param force 是否强制删除（生产环境需要显式确认）
 */
async function dropAllTables(force: boolean = false) {
  // 生产环境安全检查
  if (!force && process.env.NODE_ENV === 'production') {
    throw new Error('生产环境下删除表需要显式确认，请使用 force: true 参数')
  }

  console.log('🗑️ 开始删除表结构...')

  try {
    // 按照依赖关系逆序删除表（PostgreSQL使用CASCADE自动处理依赖）
    const tables = [
      'OrderRefund',
      'Order',
      'Product',
      'Curriculum',
      'Project',
      'Channel',
      'UserPermission',
      'UserDataPermission',
      'UserRole',
      'UserDepartment',
      'UserOrganization',
      'RolePermission',
      'RoleDataPermission',
      'Authenticator',
      'Session',
      'Account',
      'VerificationToken',
      'UserProfile',
      'User',
      'Department',
      'Organization',
      'Permission',
      'Role'
    ]

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE;`)
        console.log(`✅ 已删除表: ${table}`)
      } catch (error) {
        console.warn(`⚠️ 删除表 ${table} 时出现警告:`, error)
      }
    }

    console.log('🎉 表结构删除完成！')
  } catch (error) {
    console.error('❌ 删除表结构失败:', error)
    throw error
  }
}

/**
 * 重置数据库：先清理再初始化
 */
async function resetDatabase() {
  console.log('🔄 开始重置数据库...')

  try {
    // 1. 清理现有数据
    await cleanDatabase()

    // 2. 重新初始化数据
    await seedDatabase()

    console.log('🎉 数据库重置完成！')
  } catch (error) {
    console.error('❌ 数据库重置失败:', error)
    throw error
  }
}

/**
 * 初始化种子数据
 */
async function seedDatabase() {
  console.log('🚀 开始数据库种子数据初始化...')

  try {
    // 1. 创建用户和基础角色
    console.log('\n📝 步骤 1: 创建用户和基础角色')
    const userData = await createUsers(prisma)

    // 2. 创建权限和完整角色体系
    console.log('\n🔐 步骤 2: 创建权限和完整角色体系')
    const permissionData = await createPermissions(prisma)

    // 3. 创建组织和部门结构
    console.log('\n🏢 步骤 3: 创建组织和部门结构')
    const organization = await createOrganization(prisma)
    const departments = await createDepartments(prisma, organization.id)
    const organizationData = { organization, departments }

    // 3.1 创建用户部门关联
    console.log('\n🔗 步骤 3.1: 创建用户部门关联')
    await createUserDepartmentRelations(prisma, departments, userData)

    // 3.2 创建其他关联表数据
    console.log('\n🔗 步骤 3.2: 创建关联表数据')
    await createAllRelations(prisma, organization.id, userData)

    // 4. 创建渠道数据
    console.log('\n📺 步骤 4: 创建渠道数据')
    const channelData = await createChannels(prisma)

    // 5. 创建项目数据
    console.log('\n📚 步骤 5: 创建项目数据')
    const projectData = await createProjects(prisma)

    // 6. 创建课程数据
    console.log('\n📖 步骤 6: 创建课程数据')
    const curriculumData = await createCurriculums(prisma, {
      projects: projectData.projects
    })

    // 7. 创建产品数据
    console.log('\n📦 步骤 7: 创建产品数据')
    const productData = await createProducts(prisma, userData.adminUser)

    // 8. 创建订单数据
    console.log('\n🛒 步骤 8: 创建订单数据')
    const orders = await createOrders(prisma, {
      users: userData,
      products: productData.products,
      channels: channelData.channels
    })

    // 9. 创建退款数据
    console.log('\n💰 步骤 9: 创建退款数据')
    const refunds = await createRefunds(prisma, {
      users: userData,
      orders: orders
    })

    // 输出统计信息
    console.log('\n✅ 数据库种子数据初始化完成！')
    console.log('\n📊 统计信息:')
    console.log(`👥 用户: ${userData.normalUsers.length + 3} 个`)
    console.log(`🎭 角色: ${Object.keys(permissionData.roles).length} 个`)
    console.log(`🔑 权限: ${permissionData.permissions.length} 个`)
    console.log(`🏢 组织: 1 个`)
    console.log(`🏬 部门: ${Object.keys(organizationData.departments).length} 个`)
    console.log(`📺 渠道: ${channelData.channels.length} 个`)
    console.log(`📚 项目: ${projectData.projects.length} 个`)
    console.log(`📖 课程: ${curriculumData.curriculums.length} 个`)
    console.log(`📦 产品: ${productData.products.length} 个`)
    console.log(`🛒 订单: ${orders.length} 个`)
    console.log(`💰 退款: ${refunds.length} 个`)

  } catch (error) {
    console.error('❌ 种子数据初始化失败:', error)
    throw error
  }
}

async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2)
  const command = args[0] || 'seed'

  try {
    switch (command) {
      case 'clean':
        await cleanDatabase()
        break
      case 'drop':
        // 检查是否有force参数
        const forceFlag = process.argv.includes('--force')
        await dropAllTables(forceFlag)
        break
      case 'reset':
        await resetDatabase()
        break
      case 'seed':
      default:
        await seedDatabase()
        break
    }
  } catch (error) {
    console.error('❌ 操作失败:', error)
    throw error
  }
}

// 导出函数以便在其他模块中使用
export { cleanDatabase, dropAllTables, resetDatabase, seedDatabase }

// 如果直接运行此文件，则执行main函数
if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
}

/*
 * 使用说明:
 * 
 * 1. 初始化种子数据（默认）:
 *    npx tsx prisma/seed.ts
 *    或
 *    npx tsx prisma/seed.ts seed
 * 
 * 2. 清理数据库:
 *    npx tsx prisma/seed.ts clean
 * 
 * 3. 删除所有表结构:
 *    npx tsx prisma/seed.ts drop
 * 
 * 4. 重置数据库（清理 + 初始化）:
 *    npx tsx prisma/seed.ts reset
 * 
 * 生产环境安全选项:
 *    npx tsx prisma/seed.ts drop --force  # 强制删除表（生产环境）
 * 
 * 注意：清理和重置操作会删除所有数据，请谨慎使用！
 */