/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-20 04:09:42
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-20 16:23:20
 * @FilePath: /lulab_dashboard/prisma/seeds/refunds.ts
 * @Description: 退款种子数据
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { PrismaClient, Order, User } from '@prisma/client'

interface CreateRefundsParams {
  users: {
    adminUser: User
    financeUser: User
    normalUsers: User[]
  }
  orders: Order[]
}

export async function createRefunds(prisma: PrismaClient, params: CreateRefundsParams) {


  const { users, orders } = params
  const { adminUser, financeUser, normalUsers } = users

  // 创建退款记录
  const refunds = await Promise.all([
    // 第一个订单的部分退款
    prisma.orderRefund.create({
      data: {
        afterSaleCode: 'AS_20240125_001',
        orderId: orders[0].id,
        submittedAt: new Date('2024-01-25 10:00:00'),
        refundedAt: new Date('2024-01-26 15:30:00'),
        refundChannel: '抖音平台退款',
        approvalUrl: 'https://example.com/approval/AS_20240125_001',
        createdBy: adminUser.id,
        refundAmount: 100.00,
        refundReason: '学员因个人原因申请部分退款',
        benefitEndedAt: new Date('2024-01-25'),
        benefitUsedDays: 10,
        applicantName: '学员A',
        isFinancialSettled: true,
        financialSettledAt: new Date('2024-01-30'),
        financialNote: '已完成退款处理',
        parentId: null,
        productCategory: '课程'
      }
    }),

    // 咨询服务的全额退款
    prisma.orderRefund.create({
      data: {
        afterSaleCode: 'AS_20240305_002',
        orderId: orders[3].id,
        submittedAt: new Date('2024-03-05 14:20:00'),
        refundedAt: new Date('2024-03-06 09:15:00'),
        refundChannel: '抖音平台退款',
        approvalUrl: 'https://example.com/approval/AS_20240305_002',
        createdBy: financeUser.id,
        refundAmount: 199.00,
        refundReason: '服务质量不满意，申请全额退款',
        benefitEndedAt: new Date('2024-03-05'),
        benefitUsedDays: 4,
        applicantName: '学员D',
        isFinancialSettled: true,
        financialSettledAt: new Date('2024-03-08'),
        financialNote: '全额退款已处理',
        parentId: null,
        productCategory: '咨询'
      }
    }),

    // 会员的退款申请（未处理）
    prisma.orderRefund.create({
      data: {
        afterSaleCode: 'AS_20240315_003',
        orderId: orders[2].id,
        submittedAt: new Date('2024-03-15 16:30:00'),
        refundedAt: null,
        refundChannel: '抖音平台退款',
        approvalUrl: 'https://example.com/approval/AS_20240315_003',
        createdBy: financeUser.id,
        refundAmount: 800.00,
        refundReason: '学员搬家，无法继续学习',
        benefitEndedAt: null,
        benefitUsedDays: 74,
        applicantName: '学员C',
        isFinancialSettled: false,
        financialSettledAt: null,
        financialNote: null,
        parentId: null,
        productCategory: '会员'
      }
    }),

    // 资料包的退款（已拒绝）
    prisma.orderRefund.create({
      data: {
        afterSaleCode: 'AS_20240220_004',
        orderId: orders[4].id,
        submittedAt: new Date('2024-02-20 11:45:00'),
        refundedAt: null,
        refundChannel: '抖音平台退款',
        approvalUrl: 'https://example.com/approval/AS_20240220_004',
        createdBy: adminUser.id,
        refundAmount: 0.00,
        refundReason: '已下载资料，不符合退款条件',
        benefitEndedAt: null,
        benefitUsedDays: 5,
        applicantName: '学员E',
        isFinancialSettled: true,
        financialSettledAt: new Date('2024-02-22'),
        financialNote: '退款申请被拒绝',
        parentId: null,
        productCategory: '资料'
      }
    })
  ])



  return refunds
}