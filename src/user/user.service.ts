/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-03 03:24:19
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-09-03 14:07:06
 * @FilePath: /lulab_backend/src/user/user.service.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(userData: {
    email: string;
    name?: string;
    password?: string;
    phone?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: userData,
    });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findByPhone(countryCode: string, phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        countryCode,
        phone,
      },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async updateProfile(
    id: string,
    profileData: {
      name?: string;
      avatar?: string;
      bio?: string;
      phone?: string;
    },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...profileData,
        updatedAt: new Date(),
      },
    });
  }
}
