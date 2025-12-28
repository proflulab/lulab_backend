/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-20 04:09:42
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-04 10:22:20
 * @FilePath: /lulab_backend/prisma/seeds/orders.ts
 * @Description: 订单种子数据
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { PrismaClient, Product, User, Channel } from '@prisma/client'

interface CreateOrdersParams {
  users: {
    adminUser: User
    financeUser: User
    normalUsers: User[]
  }
  products: Product[]
  channels: Channel[]
}

export async function createOrders(prisma: PrismaClient, params: CreateOrdersParams) {
  const { users, products, channels } = params
  const { adminUser, financeUser, normalUsers } = users

  // 验证数据
  if (!products || products.length === 0) {
    throw new Error('Products array is empty or undefined')
  }

  if (products.length < 6) {
    throw new Error(`Expected at least 6 products, but got ${products.length}`)
  }

  // 生成订单编号的辅助函数
  const generateOrderCode = (index: number) => {
    const timestamp = Date.now().toString().slice(-8)
    return `ORD${timestamp}${index.toString().padStart(3, '0')}`
  }

  // 生成订单号码的辅助函数
  const generateOrderNumber = (index: number) => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const timestamp = Date.now().toString().slice(-6)
    return `${date}${timestamp}${index.toString().padStart(3, '0')}`
  }

  // 创建订单数据
  const orders = await Promise.all([
    // 已支付的课程订单
    prisma.order.create({
      data: {
        orderCode: generateOrderCode(1),
        orderNumber: generateOrderNumber(1),
        externalOrderId: 'DY_20240115_001',
        productId: products[0].id, // Python 课程
        productName: products[0].name,
        customerEmail: normalUsers[0].email,
        userId: normalUsers[0].id,
        channelId: channels[1].id, // 抖音小店
        currentOwnerId: financeUser.id,
        financialCloserId: adminUser.id,
        financialClosedAt: new Date('2024-01-20'),
        financialClosed: true,
        amount: 29900, // 299.00 yuan in cents
        currency: 'CNY',
        amountCny: 29900,
        paidAt: new Date('2024-01-15 10:30:00'),
        effectiveDate: new Date('2024-01-15'),
        benefitStartDate: new Date('2024-01-15'),
        benefitDurationDays: 365,
        activeDays: 120,
        benefitDaysRemaining: 245
      }
    }),

    // JavaScript 课程订单
    prisma.order.create({
      data: {
        orderCode: generateOrderCode(2),
        orderNumber: generateOrderNumber(2),
        externalOrderId: 'WX_20240201_002',
        productId: products[1].id, // JavaScript 课程
        productName: products[1].name,
        customerEmail: normalUsers[1].email,
        userId: normalUsers[1].id,
        channelId: channels[2].id, // 微信小程序
        currentOwnerId: financeUser.id,
        financialCloserId: adminUser.id,
        financialClosedAt: new Date('2024-02-05'),
        financialClosed: true,
        amount: 49900, // 499.00 yuan in cents
        currency: 'CNY',
        amountCny: 49900,
        paidAt: new Date('2024-02-01 14:20:00'),
        effectiveDate: new Date('2024-02-01'),
        benefitStartDate: new Date('2024-02-01'),
        benefitDurationDays: 365,
        activeDays: 90,
        benefitDaysRemaining: 275
      }
    }),

    // 会员订单
    prisma.order.create({
      data: {
        orderCode: generateOrderCode(3),
        orderNumber: generateOrderNumber(3),
        externalOrderId: 'OFF_20240101_003',
        productId: products[3].id, // 年度会员
        productName: products[3].name,
        customerEmail: normalUsers[2].email,
        userId: normalUsers[2].id,
        channelId: channels[0].id, // 官方网站
        currentOwnerId: financeUser.id,
        financialCloserId: adminUser.id,
        financialClosedAt: new Date('2024-01-05'),
        financialClosed: true,
        amount: 99900, // 999.00 yuan in cents
        currency: 'CNY',
        amountCny: 99900,
        paidAt: new Date('2024-01-01 09:15:00'),
        effectiveDate: new Date('2024-01-01'),
        benefitStartDate: new Date('2024-01-01'),
        benefitDurationDays: 365,
        activeDays: 150,
        benefitDaysRemaining: 215
      }
    }),

    // 咨询服务订单
    prisma.order.create({
      data: {
        orderCode: generateOrderCode(4),
        orderNumber: generateOrderNumber(4),
        externalOrderId: 'TB_20240301_004',
        productId: products[4].id, // 一对一技术咨询
        productName: products[4].name,
        customerEmail: normalUsers[3].email,
        userId: normalUsers[3].id,
        channelId: channels[3].id, // 淘宝店铺
        currentOwnerId: financeUser.id,
        financialCloserId: null,
        financialClosedAt: null,
        financialClosed: false,
        amount: 19900, // 199.00 yuan in cents
        currency: 'CNY',
        amountCny: 19900,
        paidAt: new Date('2024-03-01 16:45:00'),
        effectiveDate: new Date('2024-03-01'),
        benefitStartDate: new Date('2024-03-01'),
        benefitDurationDays: 30,
        activeDays: 30,
        benefitDaysRemaining: 0
      }
    }),

    // 实战项目订单
    prisma.order.create({
      data: {
        orderCode: generateOrderCode(5),
        orderNumber: generateOrderNumber(5),
        externalOrderId: 'PART_20240215_005',
        productId: products[5].id, // 企业级项目实战
        productName: products[5].name,
        customerEmail: normalUsers[4].email,
        userId: normalUsers[4].id,
        channelId: channels[5].id, // 合作伙伴
        currentOwnerId: financeUser.id,
        financialCloserId: adminUser.id,
        financialClosedAt: new Date('2024-02-20'),
        financialClosed: true,
        amount: 79900, // 799.00 yuan in cents
        currency: 'CNY',
        amountCny: 79900,
        paidAt: new Date('2024-02-15 11:30:00'),
        effectiveDate: new Date('2024-02-15'),
        benefitStartDate: new Date('2024-02-15'),
        benefitDurationDays: 365,
        activeDays: 105,
        benefitDaysRemaining: 260
      }
    }),

    // 未财务结单的订单
    prisma.order.create({
      data: {
        orderCode: generateOrderCode(6),
        orderNumber: generateOrderNumber(6),
        externalOrderId: 'OFF_20240320_006',
        productId: products[2].id, // 数据分析与可视化
        productName: products[2].name,
        customerEmail: 'student6@example.com',
        userId: null, // 未注册用户
        channelId: channels[4].id, // 线下推广
        currentOwnerId: financeUser.id,
        financialCloserId: null,
        financialClosedAt: null,
        financialClosed: false,
        amount: 39900, // 399.00 yuan in cents
        currency: 'CNY',
        amountCny: 39900,
        paidAt: new Date('2024-03-20 13:20:00'),
        effectiveDate: new Date('2024-03-20'),
        benefitStartDate: new Date('2024-03-20'),
        benefitDurationDays: 365,
        activeDays: 30,
        benefitDaysRemaining: 335
      }
    }),

    // 美元支付的订单
    prisma.order.create({
      data: {
        orderCode: generateOrderCode(7),
        orderNumber: generateOrderNumber(7),
        externalOrderId: 'STRIPE_20240310_007',
        productId: products[1].id, // JavaScript 课程
        productName: products[1].name,
        customerEmail: 'international@example.com',
        userId: null,
        channelId: channels[0].id, // 官方网站
        currentOwnerId: financeUser.id,
        financialCloserId: adminUser.id,
        financialClosedAt: new Date('2024-03-15'),
        financialClosed: true,
        amount: 7000, // 70.00 USD in cents
        currency: 'USD',
        amountCny: 49900, // 499.00 yuan in cents (按汇率折算)
        paidAt: new Date('2024-03-10 08:45:00'),
        effectiveDate: new Date('2024-03-10'),
        benefitStartDate: new Date('2024-03-10'),
        benefitDurationDays: 365,
        activeDays: 40,
        benefitDaysRemaining: 325
      }
    })
  ])

  return orders
}