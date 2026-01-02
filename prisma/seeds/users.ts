/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-19 21:41:26
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-15 20:19:57
 * @FilePath: /lulab_backend/prisma/seeds/users.ts
 * @Description: 用户数据种子模块
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { PrismaClient, $Enums, User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// 常量配置
const PASSWORDS = {
  admin: 'admin123',
  user: 'user123',
} as const;

const COUNTRY_CODE = '+86' as const;
const COUNTRY = '中国' as const;

// 用户配置数据
const USER_CONFIGS = {
  admin: {
    email: 'admin@lulab.com',
    phone: '13800138000',
    profile: {
      name: '系统管理员',
      firstName: '系统',
      lastName: '管理员',
      gender: $Enums.Gender.PREFER_NOT_TO_SAY,
      bio: '系统管理员账户，负责系统整体管理和维护',
    },
  },
  finance: {
    email: 'finance@lulab.com',
    phone: '13800138001',
    profile: {
      name: '财务专员',
      firstName: '财务',
      lastName: '专员',
      gender: $Enums.Gender.FEMALE,
      bio: '负责公司财务管理和账务处理',
      city: '北京',
      country: COUNTRY,
    },
  },
  customerService: {
    email: 'service@lulab.com',
    phone: '13800138002',
    profile: {
      name: '客服专员',
      firstName: '客服',
      lastName: '专员',
      gender: $Enums.Gender.FEMALE,
      bio: '负责客户服务和问题解答',
      city: '上海',
      country: COUNTRY,
    },
  },
} as const;

// 普通用户配置
const NORMAL_USER_PROFILES = [
  {
    name: '张三',
    firstName: '三',
    lastName: '张',
    gender: $Enums.Gender.MALE,
    city: '北京',
    bio: '软件工程师，热爱编程',
  },
  {
    name: '李四',
    firstName: '四',
    lastName: '李',
    gender: $Enums.Gender.FEMALE,
    city: '上海',
    bio: '产品经理，关注用户体验',
  },
  {
    name: '王五',
    firstName: '五',
    lastName: '王',
    gender: $Enums.Gender.MALE,
    city: '广州',
    bio: '数据分析师，擅长数据挖掘',
  },
  {
    name: '赵六',
    firstName: '六',
    lastName: '赵',
    gender: $Enums.Gender.FEMALE,
    city: '深圳',
    bio: 'UI设计师，追求美感',
  },
  {
    name: '钱七',
    firstName: '七',
    lastName: '钱',
    gender: $Enums.Gender.OTHER,
    city: '杭州',
    bio: '市场专员，善于沟通',
  },
] as const;

// 角色配置
const ROLE_CONFIGS = {
  admin: {
    code: 'ADMIN',
    name: '管理员',
    description: '系统管理员，拥有大部分管理权限',
    level: 1,
    type: $Enums.RoleType.SYSTEM,
  },
  finance: {
    code: 'FINANCE',
    name: '财务',
    description: '财务人员，拥有财务相关权限',
    level: 3,
    type: $Enums.RoleType.CUSTOM,
  },
  customerService: {
    code: 'CUSTOMER_SERVICE',
    name: '客服',
    description: '客服人员，拥有客户服务权限',
    level: 4,
    type: $Enums.RoleType.CUSTOM,
  },
  user: {
    code: 'USER',
    name: '普通用户',
    description: '普通用户，基础查看权限',
    level: 5,
    type: $Enums.RoleType.CUSTOM,
  },
} as const;

export interface CreatedUsers {
  adminUser: User;
  financeUser: User;
  customerServiceUser: User;
  normalUsers: User[];
  roles: {
    admin: Role;
    finance: Role;
    customerService: Role;
    user: Role;
  };
}

/**
 * 创建用户并关联档案
 */
async function createUserWithProfile(
  prisma: PrismaClient,
  email: string,
  phone: string,
  password: string,
  profileData: Record<string, any>,
): Promise<User> {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: password,
      emailVerifiedAt: new Date(),
      countryCode: COUNTRY_CODE,
      phone,
      phoneVerifiedAt: new Date(),
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      ...profileData,
    },
  });

  return user;
}

/**
 * 创建角色
 */
async function createRole(
  prisma: PrismaClient,
  code: string,
  name: string,
  description: string,
  level: number,
  type: $Enums.RoleType,
): Promise<Role> {
  return prisma.role.upsert({
    where: { code },
    update: {},
    create: {
      code,
      name,
      description,
      level,
      type,
    },
  });
}

/**
 * 分配用户角色
 */
async function assignUserRole(
  prisma: PrismaClient,
  userId: string,
  roleId: string,
): Promise<void> {
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    update: {},
    create: {
      userId,
      roleId,
    },
  });
}

export async function createUsers(prisma: PrismaClient): Promise<CreatedUsers> {
  // 并行生成密码哈希
  const [adminPasswordHash, userPasswordHash] = await Promise.all([
    bcrypt.hash(PASSWORDS.admin, 10),
    bcrypt.hash(PASSWORDS.user, 10),
  ]);

  // 并行创建特殊用户和管理员
  const [adminUser, financeUser, customerServiceUser] = await Promise.all([
    createUserWithProfile(
      prisma,
      USER_CONFIGS.admin.email,
      USER_CONFIGS.admin.phone,
      adminPasswordHash,
      USER_CONFIGS.admin.profile,
    ),
    createUserWithProfile(
      prisma,
      USER_CONFIGS.finance.email,
      USER_CONFIGS.finance.phone,
      adminPasswordHash,
      USER_CONFIGS.finance.profile,
    ),
    createUserWithProfile(
      prisma,
      USER_CONFIGS.customerService.email,
      USER_CONFIGS.customerService.phone,
      adminPasswordHash,
      USER_CONFIGS.customerService.profile,
    ),
  ]);

  // 并行创建普通用户
  const normalUserPromises = NORMAL_USER_PROFILES.map(
    async (profile, index) => {
      const userNumber = index + 1;
      const email = `user${userNumber}@example.com`;
      const phone = `1380013800${userNumber.toString().padStart(2, '0')}`;

      return createUserWithProfile(prisma, email, phone, userPasswordHash, {
        ...profile,
        country: COUNTRY,
        dateOfBirth: new Date(
          1990 + userNumber,
          userNumber % 12,
          ((userNumber * 5) % 28) + 1,
        ),
      });
    },
  );

  const normalUsers = await Promise.all(normalUserPromises);

  // 并行创建角色
  const roles = {
    admin: await createRole(
      prisma,
      ROLE_CONFIGS.admin.code,
      ROLE_CONFIGS.admin.name,
      ROLE_CONFIGS.admin.description,
      ROLE_CONFIGS.admin.level,
      ROLE_CONFIGS.admin.type,
    ),
    finance: await createRole(
      prisma,
      ROLE_CONFIGS.finance.code,
      ROLE_CONFIGS.finance.name,
      ROLE_CONFIGS.finance.description,
      ROLE_CONFIGS.finance.level,
      ROLE_CONFIGS.finance.type,
    ),
    customerService: await createRole(
      prisma,
      ROLE_CONFIGS.customerService.code,
      ROLE_CONFIGS.customerService.name,
      ROLE_CONFIGS.customerService.description,
      ROLE_CONFIGS.customerService.level,
      ROLE_CONFIGS.customerService.type,
    ),
    user: await createRole(
      prisma,
      ROLE_CONFIGS.user.code,
      ROLE_CONFIGS.user.name,
      ROLE_CONFIGS.user.description,
      ROLE_CONFIGS.user.level,
      ROLE_CONFIGS.user.type,
    ),
  };

  // 并行分配角色
  await Promise.all([
    assignUserRole(prisma, adminUser.id, roles.admin.id),
    assignUserRole(prisma, financeUser.id, roles.finance.id),
    assignUserRole(prisma, customerServiceUser.id, roles.customerService.id),
    ...normalUsers.map((user) =>
      assignUserRole(prisma, user.id, roles.user.id),
    ),
  ]);

  return {
    adminUser,
    financeUser,
    customerServiceUser,
    normalUsers,
    roles,
  };
}
