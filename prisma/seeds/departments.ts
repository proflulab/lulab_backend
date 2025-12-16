/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-16 10:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-16 10:00:00
 * @FilePath: /lulab_backend/prisma/seeds/departments.ts
 * @Description: 部门数据种子模块 - 优化版本
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { PrismaClient, Department, Prisma } from '@prisma/client';
import { CreatedUsers } from './users';

// ==================== 类型定义 ====================

/**
 * 创建部门后返回的数据
 */
export interface CreatedDepartments {
  tech: Department;
  sales: Department;
  finance: Department;
  hr: Department;
  customerService: Department;
  // 子部门
  techDev: Department;
  techOps: Department;
  salesDirect: Department;
  salesChannel: Department;
}

/**
 * 部门配置数据类型
 */
interface DepartmentConfig {
  code: string;
  name: string;
  description: string;
  level: number;
  sortOrder: number;
  parentCode?: string; // 父部门代码
}

// ==================== 部门配置数据 ====================

/**
 * 部门配置数据
 * 包含一级部门和二级部门
 */
const DEPARTMENT_CONFIGS: DepartmentConfig[] = [
  // 一级部门
  {
    code: 'TECH',
    name: '技术部',
    description: '负责技术研发和系统维护',
    level: 1,
    sortOrder: 1,
  },
  {
    code: 'SALES',
    name: '销售部',
    description: '负责产品销售和市场推广',
    level: 1,
    sortOrder: 2,
  },
  {
    code: 'FINANCE',
    name: '财务部',
    description: '负责财务管理和会计核算',
    level: 1,
    sortOrder: 3,
  },
  {
    code: 'HR',
    name: '人力资源部',
    description: '负责人力资源管理和招聘',
    level: 1,
    sortOrder: 4,
  },
  {
    code: 'CUSTOMER_SERVICE',
    name: '客服部',
    description: '负责客户服务和售后支持',
    level: 1,
    sortOrder: 5,
  },
  // 二级部门（子部门）
  {
    code: 'TECH_DEV',
    name: '研发组',
    description: '负责产品研发和功能开发',
    level: 2,
    sortOrder: 1,
    parentCode: 'TECH',
  },
  {
    code: 'TECH_OPS',
    name: '运维组',
    description: '负责系统运维和基础设施管理',
    level: 2,
    sortOrder: 2,
    parentCode: 'TECH',
  },
  {
    code: 'SALES_DIRECT',
    name: '直销组',
    description: '负责直接客户销售',
    level: 2,
    sortOrder: 1,
    parentCode: 'SALES',
  },
  {
    code: 'SALES_CHANNEL',
    name: '渠道组',
    description: '负责渠道合作和代理商管理',
    level: 2,
    sortOrder: 2,
    parentCode: 'SALES',
  },
];

// ==================== 主函数 ====================

/**
 * 创建部门数据
 *
 * @param prisma - Prisma 客户端实例
 * @param organizationId - 组织 ID
 * @returns 创建的部门数据
 */

export async function createDepartments(
  prisma: PrismaClient,
  organizationId: string,
): Promise<CreatedDepartments> {
  console.log('🏬 开始创建部门数据...');

  try {
    // 创建部门映射表，用于存储已创建的部门
    const departmentMap = new Map<string, Department>();

    // 第一步：创建所有一级部门（没有 parentCode 的部门）
    const level1Configs = DEPARTMENT_CONFIGS.filter(
      (config) => !config.parentCode,
    );
    const level1Promises = level1Configs.map(async (config) => {
      const department = await prisma.department.upsert({
        where: { code: config.code },
        update: {
          name: config.name,
          description: config.description,
          organizationId,
          level: config.level,
          sortOrder: config.sortOrder,
        },
        create: {
          code: config.code,
          name: config.name,
          description: config.description,
          organizationId,
          level: config.level,
          sortOrder: config.sortOrder,
        },
      });

      departmentMap.set(config.code, department);
      console.log(`✅ 创建一级部门: ${department.name}`);
      return department;
    });

    await Promise.all(level1Promises);

    // 第二步：创建所有二级部门（有 parentCode 的部门）
    const level2Configs = DEPARTMENT_CONFIGS.filter(
      (config) => config.parentCode,
    );
    const level2Promises = level2Configs.map(async (config) => {
      const parentDepartment = departmentMap.get(config.parentCode!);
      if (!parentDepartment) {
        throw new Error(`Parent department not found: ${config.parentCode}`);
      }

      const department = await prisma.department.upsert({
        where: { code: config.code },
        update: {
          name: config.name,
          description: config.description,
          organizationId,
          parentId: parentDepartment.id,
          level: config.level,
          sortOrder: config.sortOrder,
        },
        create: {
          code: config.code,
          name: config.name,
          description: config.description,
          organizationId,
          parentId: parentDepartment.id,
          level: config.level,
          sortOrder: config.sortOrder,
        },
      });

      departmentMap.set(config.code, department);
      console.log(
        `✅ 创建二级部门: ${department.name} (隶属于 ${parentDepartment.name})`,
      );
      return department;
    });

    await Promise.all(level2Promises);

    console.log(`🏢 部门数据创建完成，共 ${departmentMap.size} 个部门`);

    // 返回按照接口定义的部门对象
    return {
      tech: departmentMap.get('TECH')!,
      sales: departmentMap.get('SALES')!,
      finance: departmentMap.get('FINANCE')!,
      hr: departmentMap.get('HR')!,
      customerService: departmentMap.get('CUSTOMER_SERVICE')!,
      techDev: departmentMap.get('TECH_DEV')!,
      techOps: departmentMap.get('TECH_OPS')!,
      salesDirect: departmentMap.get('SALES_DIRECT')!,
      salesChannel: departmentMap.get('SALES_CHANNEL')!,
    };
  } catch (error) {
    console.error('❌ 创建部门数据失败:', error);
    throw error;
  }
}

// ==================== 用户部门关联 ====================

/**
 * 创建用户部门关联数据
 *
 * @param prisma - Prisma 客户端实例
 * @param departments - 已创建的部门数据
 * @param users - 用户数据
 */
export async function createUserDepartmentRelations(
  prisma: PrismaClient,
  departments: CreatedDepartments,
  users: CreatedUsers,
): Promise<void> {
  // 管理员用户 - 技术部（主要部门）
  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: users.adminUser.id,
        departmentId: departments.tech.id,
      },
    },
    update: {},
    create: {
      userId: users.adminUser.id,
      departmentId: departments.tech.id,
      isPrimary: true,
    },
  });

  // 财务用户 - 财务部（主要部门）
  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: users.financeUser.id,
        departmentId: departments.finance.id,
      },
    },
    update: {},
    create: {
      userId: users.financeUser.id,
      departmentId: departments.finance.id,
      isPrimary: true,
    },
  });

  // 客服用户 - 客服部（主要部门）
  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: users.customerServiceUser.id,
        departmentId: departments.customerService.id,
      },
    },
    update: {},
    create: {
      userId: users.customerServiceUser.id,
      departmentId: departments.customerService.id,
      isPrimary: true,
    },
  });

  // 普通用户分配到不同部门
  const departmentAssignments = [
    {
      user: users.normalUsers[0],
      department: departments.techDev,
      isPrimary: true,
    }, // 张三 - 研发组
    {
      user: users.normalUsers[1],
      department: departments.salesDirect,
      isPrimary: true,
    }, // 李四 - 直销组
    {
      user: users.normalUsers[2],
      department: departments.techOps,
      isPrimary: true,
    }, // 王五 - 运维组
    {
      user: users.normalUsers[3],
      department: departments.salesChannel,
      isPrimary: true,
    }, // 赵六 - 渠道组
    { user: users.normalUsers[4], department: departments.hr, isPrimary: true }, // 钱七 - 人力资源部
  ];

  for (const assignment of departmentAssignments) {
    await prisma.userDepartment.upsert({
      where: {
        userId_departmentId: {
          userId: assignment.user.id,
          departmentId: assignment.department.id,
        },
      },
      update: {},
      create: {
        userId: assignment.user.id,
        departmentId: assignment.department.id,
        isPrimary: assignment.isPrimary,
      },
    });
  }

  // 为一些用户添加跨部门关联（非主要部门）
  // 张三同时属于技术部（父部门）
  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: users.normalUsers[0].id,
        departmentId: departments.tech.id,
      },
    },
    update: {},
    create: {
      userId: users.normalUsers[0].id,
      departmentId: departments.tech.id,
      isPrimary: false,
    },
  });

  // 李四同时属于销售部（父部门）
  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: users.normalUsers[1].id,
        departmentId: departments.sales.id,
      },
    },
    update: {},
    create: {
      userId: users.normalUsers[1].id,
      departmentId: departments.sales.id,
      isPrimary: false,
    },
  });
}
