/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-19 21:41:26
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-04 10:22:26
 * @FilePath: /lulab_backend/prisma/seeds/departments.ts
 * @Description: 部门种子模块
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { PrismaClient, Department } from '@prisma/client'
import { CreatedUsers } from './users'

export interface CreatedDepartments {
    tech: Department
    sales: Department
    finance: Department
    hr: Department
    customerService: Department
    // 子部门
    techDev: Department
    techOps: Department
    salesDirect: Department
    salesChannel: Department
}

export async function createDepartments(prisma: PrismaClient, organizationId: string): Promise<CreatedDepartments> {

    // 创建一级部门
    const tech = await prisma.department.upsert({
        where: { code: 'TECH' },
        update: {},
        create: {
            name: '技术部',
            code: 'TECH',
            description: '负责技术研发和系统维护',
            organizationId,
            level: 1,
            sortOrder: 1,
        },
    })

    const sales = await prisma.department.upsert({
        where: { code: 'SALES' },
        update: {},
        create: {
            name: '销售部',
            code: 'SALES',
            description: '负责产品销售和市场推广',
            organizationId,
            level: 1,
            sortOrder: 2,
        },
    })

    const finance = await prisma.department.upsert({
        where: { code: 'FINANCE' },
        update: {},
        create: {
            name: '财务部',
            code: 'FINANCE',
            description: '负责财务管理和会计核算',
            organizationId,
            level: 1,
            sortOrder: 3,
        },
    })

    const hr = await prisma.department.upsert({
        where: { code: 'HR' },
        update: {},
        create: {
            name: '人力资源部',
            code: 'HR',
            description: '负责人力资源管理和招聘',
            organizationId,
            level: 1,
            sortOrder: 4,
        },
    })

    const customerService = await prisma.department.upsert({
        where: { code: 'CUSTOMER_SERVICE' },
        update: {},
        create: {
            name: '客服部',
            code: 'CUSTOMER_SERVICE',
            description: '负责客户服务和售后支持',
            organizationId,
            level: 1,
            sortOrder: 5,
        },
    })

    // 创建二级部门（子部门）
    const techDev = await prisma.department.upsert({
        where: { code: 'TECH_DEV' },
        update: {},
        create: {
            name: '研发组',
            code: 'TECH_DEV',
            description: '负责产品研发和功能开发',
            organizationId,
            parentId: tech.id,
            level: 2,
            sortOrder: 1,
        },
    })

    const techOps = await prisma.department.upsert({
        where: { code: 'TECH_OPS' },
        update: {},
        create: {
            name: '运维组',
            code: 'TECH_OPS',
            description: '负责系统运维和基础设施管理',
            organizationId,
            parentId: tech.id,
            level: 2,
            sortOrder: 2,
        },
    })

    const salesDirect = await prisma.department.upsert({
        where: { code: 'SALES_DIRECT' },
        update: {},
        create: {
            name: '直销组',
            code: 'SALES_DIRECT',
            description: '负责直接客户销售',
            organizationId,
            parentId: sales.id,
            level: 2,
            sortOrder: 1,
        },
    })

    const salesChannel = await prisma.department.upsert({
        where: { code: 'SALES_CHANNEL' },
        update: {},
        create: {
            name: '渠道组',
            code: 'SALES_CHANNEL',
            description: '负责渠道合作和代理商管理',
            organizationId,
            parentId: sales.id,
            level: 2,
            sortOrder: 2,
        },
    })

    return {
        tech,
        sales,
        finance,
        hr,
        customerService,
        techDev,
        techOps,
        salesDirect,
        salesChannel,
    }
}

// 创建用户部门关联数据
export async function createUserDepartmentRelations(
    prisma: PrismaClient,
    departments: CreatedDepartments,
    users: CreatedUsers
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
    })

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
    })

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
    })

    // 普通用户分配到不同部门
    const departmentAssignments = [
        { user: users.normalUsers[0], department: departments.techDev, isPrimary: true }, // 张三 - 研发组
        { user: users.normalUsers[1], department: departments.salesDirect, isPrimary: true }, // 李四 - 直销组
        { user: users.normalUsers[2], department: departments.techOps, isPrimary: true }, // 王五 - 运维组
        { user: users.normalUsers[3], department: departments.salesChannel, isPrimary: true }, // 赵六 - 渠道组
        { user: users.normalUsers[4], department: departments.hr, isPrimary: true }, // 钱七 - 人力资源部
    ]

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
        })
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
    })

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
    })
}