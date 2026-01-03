/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-16 10:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-03 06:27:57
 * @FilePath: /lulab_backend/prisma/seeds/orders.ts
 * @Description: 订单数据种子模块 - 优化版本
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */
import { PrismaClient, Product, User, Channel, Currency } from '@prisma/client';

interface CreateOrdersParams {
  users: {
    adminUser: User;
    financeUser: User;
    normalUsers: User[];
  };
  products: Product[];
  channels: Channel[];
}

interface OrderConfig {
  productIndex: number;
  userIndex: number;
  channelIndex: number;
  externalOrderId: string;
  amount: number;
  currency: Currency;
  amountCny: number;
  paidAt: string;
  effectiveDate: string;
  benefitDurationDays: number;
  activeDays: number;
  financialClosed: boolean;
  financialClosedAt?: string;
  customerEmail?: string;
}

const ORDER_CONFIGS: OrderConfig[] = [
  {
    productIndex: 0,
    userIndex: 0,
    channelIndex: 1,
    externalOrderId: 'DY_20240115_001',
    amount: 29900,
    currency: Currency.CNY,
    amountCny: 29900,
    paidAt: '2024-01-15 10:30:00',
    effectiveDate: '2024-01-15',
    benefitDurationDays: 365,
    activeDays: 120,
    financialClosed: true,
    financialClosedAt: '2024-01-20',
  },
  {
    productIndex: 1,
    userIndex: 1,
    channelIndex: 2,
    externalOrderId: 'WX_20240201_002',
    amount: 49900,
    currency: Currency.CNY,
    amountCny: 49900,
    paidAt: '2024-02-01 14:20:00',
    effectiveDate: '2024-02-01',
    benefitDurationDays: 365,
    activeDays: 90,
    financialClosed: true,
    financialClosedAt: '2024-02-05',
  },
  {
    productIndex: 3,
    userIndex: 2,
    channelIndex: 0,
    externalOrderId: 'OFF_20240101_003',
    amount: 99900,
    currency: Currency.CNY,
    amountCny: 99900,
    paidAt: '2024-01-01 09:15:00',
    effectiveDate: '2024-01-01',
    benefitDurationDays: 365,
    activeDays: 150,
    financialClosed: true,
    financialClosedAt: '2024-01-05',
  },
  {
    productIndex: 4,
    userIndex: 3,
    channelIndex: 3,
    externalOrderId: 'TB_20240301_004',
    amount: 19900,
    currency: Currency.CNY,
    amountCny: 19900,
    paidAt: '2024-03-01 16:45:00',
    effectiveDate: '2024-03-01',
    benefitDurationDays: 30,
    activeDays: 30,
    financialClosed: false,
  },
  {
    productIndex: 5,
    userIndex: 4,
    channelIndex: 5,
    externalOrderId: 'PART_20240215_005',
    amount: 79900,
    currency: Currency.CNY,
    amountCny: 79900,
    paidAt: '2024-02-15 11:30:00',
    effectiveDate: '2024-02-15',
    benefitDurationDays: 365,
    activeDays: 105,
    financialClosed: true,
    financialClosedAt: '2024-02-20',
  },
  {
    productIndex: 2,
    userIndex: -1,
    channelIndex: 4,
    externalOrderId: 'OFF_20240320_006',
    amount: 39900,
    currency: Currency.CNY,
    amountCny: 39900,
    paidAt: '2024-03-20 13:20:00',
    effectiveDate: '2024-03-20',
    benefitDurationDays: 365,
    activeDays: 30,
    financialClosed: false,
    customerEmail: 'student6@example.com',
  },
  {
    productIndex: 1,
    userIndex: -1,
    channelIndex: 0,
    externalOrderId: 'STRIPE_20240310_007',
    amount: 7000,
    currency: Currency.USD,
    amountCny: 49900,
    paidAt: '2024-03-10 08:45:00',
    effectiveDate: '2024-03-10',
    benefitDurationDays: 365,
    activeDays: 40,
    financialClosed: true,
    financialClosedAt: '2024-03-15',
    customerEmail: 'international@example.com',
  },
];

export async function createOrders(
  prisma: PrismaClient,
  params: CreateOrdersParams,
) {
  const { users, products, channels } = params;
  const { adminUser, financeUser, normalUsers } = users;

  if (!products || products.length === 0) {
    throw new Error('Products array is empty or undefined');
  }

  if (products.length < 6) {
    throw new Error(`Expected at least 6 products, but got ${products.length}`);
  }

  if (!channels || channels.length === 0) {
    throw new Error('Channels array is empty or undefined');
  }

  if (channels.length < 6) {
    throw new Error(`Expected at least 6 channels, but got ${channels.length}`);
  }

  if (!normalUsers || normalUsers.length === 0) {
    throw new Error('Normal users array is empty or undefined');
  }

  if (normalUsers.length < 5) {
    throw new Error(
      `Expected at least 5 normal users, but got ${normalUsers.length}`,
    );
  }

  const generateOrderCode = (index: number) => {
    const timestamp = Date.now().toString().slice(-8);
    return `ORD${timestamp}${index.toString().padStart(3, '0')}`;
  };

  const generateOrderNumber = (index: number) => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-6);
    return `${date}${timestamp}${index.toString().padStart(3, '0')}`;
  };

  const calculateBenefitDaysRemaining = (
    activeDays: number,
    benefitDurationDays: number,
  ) => {
    return benefitDurationDays - activeDays;
  };

  const orders = await Promise.all(
    ORDER_CONFIGS.map((config, index) => {
      const product = products[config.productIndex];
      const channel = channels[config.channelIndex];
      const user = config.userIndex >= 0 ? normalUsers[config.userIndex] : null;
      const customerEmail =
        config.customerEmail || (user ? user.email : undefined);

      if (!product) {
        throw new Error(`Product at index ${config.productIndex} not found`);
      }

      if (!channel) {
        throw new Error(`Channel at index ${config.channelIndex} not found`);
      }

      return prisma.order.create({
        data: {
          orderCode: generateOrderCode(index + 1),
          orderNumber: generateOrderNumber(index + 1),
          externalOrderId: config.externalOrderId,
          productId: product.id,
          productName: product.name,
          customerEmail,
          userId: user ? user.id : null,
          channelId: channel.id,
          currentOwnerId: financeUser.id,
          financialCloserId: config.financialClosed ? adminUser.id : null,
          financialClosedAt: config.financialClosedAt
            ? new Date(config.financialClosedAt)
            : null,
          financialClosed: config.financialClosed,
          amount: config.amount,
          currency: config.currency,
          amountCny: config.amountCny,
          paidAt: new Date(config.paidAt),
          effectiveDate: new Date(config.effectiveDate),
          benefitStartDate: new Date(config.effectiveDate),
          benefitDurationDays: config.benefitDurationDays,
          activeDays: config.activeDays,
          benefitDaysRemaining: calculateBenefitDaysRemaining(
            config.activeDays,
            config.benefitDurationDays,
          ),
        },
      });
    }),
  );

  return orders;
}
