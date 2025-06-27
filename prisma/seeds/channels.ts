/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-22 03:48:43
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-22 03:54:51
 * @FilePath: /lulab_dashboard/prisma/seeds/channels.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { PrismaClient, Channel } from '@prisma/client'

export interface CreatedChannels {
    channels: Channel[]
}

export async function createChannels(prisma: PrismaClient): Promise<CreatedChannels> {
    try {
        const channelData = [
            {
                name: '官方网站',
                code: 'OFFICIAL_WEBSITE',
                description: '官方网站直接购买渠道'
            },
            {
                name: '抖音小店',
                code: 'DOUYIN_SHOP',
                description: '抖音平台销售渠道'
            },
            {
                name: '微信小程序',
                code: 'WECHAT_MINIPROGRAM',
                description: '微信小程序销售渠道'
            },
            {
                name: '淘宝店铺',
                code: 'TAOBAO_SHOP',
                description: '淘宝平台销售渠道'
            },
            {
                name: '线下推广',
                code: 'OFFLINE_PROMOTION',
                description: '线下活动推广渠道'
            },
            {
                name: '合作伙伴',
                code: 'PARTNER',
                description: '合作伙伴推荐渠道'
            }
        ]

        const channels: Channel[] = []
        for (const data of channelData) {
            // 先检查是否已存在相同编码的渠道
            const existingChannel = await prisma.channel.findFirst({
                where: { code: data.code }
            })

            let channel
            if (existingChannel) {
                // 如果存在，更新数据
                channel = await prisma.channel.update({
                    where: { id: existingChannel.id },
                    data: data
                })
                console.log(`🔄 更新渠道: ${channel.name}`)
            } else {
                // 如果不存在，创建新渠道
                channel = await prisma.channel.create({
                    data: data
                })
                console.log(`✅ 创建渠道: ${channel.name}`)
            }
            channels.push(channel)
        }

        console.log('✅ 渠道数据创建成功')
        return { channels }
    } catch (error) {
        console.error('❌ 渠道数据创建失败:', error)
        throw error
    }
}