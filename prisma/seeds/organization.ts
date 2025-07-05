/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-19 21:41:26
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-24 13:14:58
 * @FilePath: /lulab_dashboard/prisma/seeds/organization.ts
 * @Description: 组织种子模块
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { PrismaClient } from '@prisma/client'

export async function createOrganization(prisma: PrismaClient) {

    // 创建基础组织
    const organization = await prisma.organization.upsert({
        where: { code: 'LULAB' },
        update: {},
        create: {
            name: 'LuLab科技有限公司',
            code: 'LULAB',
            description: 'LuLab科技有限公司',
        },
    })

    return organization
}