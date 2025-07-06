import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import { CodeType } from '../dto/auth.dto';
import { VerificationCodeType } from '@prisma/client';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) { }

  // 发送验证码
  async sendCode(
    target: string,
    type: CodeType,
    ip: string,
    userAgent?: string,
    countryCode?: string,
  ): Promise<{ success: boolean; message: string }> {
    // 验证目标格式
    const isEmail = this.isValidEmail(target);
    const isPhone = this.isValidPhone(target);

    if (!isEmail && !isPhone) {
      throw new BadRequestException('目标必须是有效的邮箱或手机号');
    }

    // 检查发送频率限制
    await this.checkSendLimit(target, ip);

    // 生成验证码
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    // 转换验证码类型
    const codeType = this.convertCodeType(type);

    // 保存验证码到数据库
    await this.prisma.verificationCode.create({
      data: {
        target,
        code,
        type: codeType,
        expiresAt,
        ip,
        userAgent,
      },
    });

    // 发送验证码
    if (isEmail) {
      await this.sendEmailCode(target, code, type);
    } else {
      // TODO: 实现短信发送
      await this.sendSmsCode(target, code, type, countryCode);
    }

    // 更新发送限制记录
    await this.updateSendLimit(target, ip);

    return {
      success: true,
      message: isEmail ? '验证码已发送到邮箱' : '验证码已发送到手机',
    };
  }

  // 验证验证码
  async verifyCode(
    target: string,
    code: string,
    type: CodeType,
  ): Promise<{ valid: boolean; message: string }> {
    const codeType = this.convertCodeType(type);

    // 查找有效的验证码
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        target,
        code,
        type: codeType,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationCode) {
      return {
        valid: false,
        message: '验证码无效或已过期',
      };
    }

    // 标记验证码为已使用
    await this.prisma.verificationCode.update({
      where: {
        id: verificationCode.id,
      },
      data: {
        used: true,
      },
    });

    return {
      valid: true,
      message: '验证码验证成功',
    };
  }

  // 清理过期验证码
  async cleanExpiredCodes(): Promise<number> {
    const result = await this.prisma.verificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  // 检查发送频率限制
  private async checkSendLimit(target: string, ip: string): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 检查同一目标1小时内发送次数（最多5次）
    const targetCount = await this.prisma.verificationCode.count({
      where: {
        target,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (targetCount >= 5) {
      throw new HttpException('发送过于频繁，请1小时后再试', HttpStatus.TOO_MANY_REQUESTS);
    }

    // 检查同一IP1天内发送次数（最多20次）
    const ipCount = await this.prisma.verificationCode.count({
      where: {
        ip,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (ipCount >= 20) {
      throw new HttpException('发送过于频繁，请明天再试', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  // 更新发送限制记录
  private async updateSendLimit(target: string, ip: string): Promise<void> {
    await this.prisma.codeSendLimit.upsert({
      where: {
        target_ip: {
          target,
          ip,
        },
      },
      update: {
        sendCount: {
          increment: 1,
        },
        lastSentAt: new Date(),
      },
      create: {
        target,
        ip,
        sendCount: 1,
        lastSentAt: new Date(),
      },
    });
  }

  // 发送邮箱验证码
  private async sendEmailCode(
    email: string,
    code: string,
    type: CodeType,
  ): Promise<void> {
    const typeMap = {
      [CodeType.REGISTER]: 'register',
      [CodeType.LOGIN]: 'login',
      [CodeType.RESET_PASSWORD]: 'reset_password',
    };

    await this.emailService.sendVerificationCode(
      email,
      code,
      typeMap[type] as 'register' | 'login' | 'reset_password',
    );
  }

  // 发送短信验证码（待实现）
  private async sendSmsCode(
    phone: string,
    code: string,
    type: CodeType,
    countryCode?: string,
  ): Promise<void> {
    // TODO: 集成短信服务提供商（如阿里云、腾讯云等）
    console.log(`发送短信验证码到 ${countryCode}${phone}: ${code}`);

    // 暂时抛出异常，提示未实现
    throw new BadRequestException('短信验证码功能暂未开放，请使用邮箱验证');
  }

  // 生成6位数字验证码
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 验证邮箱格式
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证手机号格式（简单验证）
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[1-9]\d{10}$/; // 中国手机号格式
    return phoneRegex.test(phone);
  }

  // 转换验证码类型
  private convertCodeType(type: CodeType): VerificationCodeType {
    const typeMap = {
      [CodeType.REGISTER]: VerificationCodeType.REGISTER,
      [CodeType.LOGIN]: VerificationCodeType.LOGIN,
      [CodeType.RESET_PASSWORD]: VerificationCodeType.RESET_PASSWORD,
    };
    return typeMap[type];
  }
}