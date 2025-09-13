import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../repositories/auth.repository';
import { VerificationService } from './verification.service';
import { EmailService } from '../../email/email.service';
import {
  RegisterDto,
  LoginDto,
  SendCodeDto,
  VerifyCodeDto,
  ResetPasswordDto,
  UpdateProfileDto,
  AuthResponseDto,
  UserProfileResponseDto,
  AuthType,
  CodeType,
} from '../../dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { isStrongPassword } from '@libs/common/utils';
import { User, UserProfile } from '@prisma/client';
import { LoginType } from '../types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15分钟

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly verificationService: VerificationService,
    private readonly emailService: EmailService,
  ) {}

  // 用户注册
  async register(
    registerDto: RegisterDto,
    ip: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const { type, username, email, phone, password, code, countryCode } =
      registerDto;

    // 验证注册方式
    this.validateRegisterType(type, registerDto);

    // 检查用户是否已存在
    await this.checkUserExists(username, email, phone, countryCode);

    // 验证验证码（现在所有注册都需要验证码）
    if (type === AuthType.EMAIL_CODE || type === AuthType.PHONE_CODE) {
      const target = type === AuthType.EMAIL_CODE ? email : phone;
      const verifyResult = await this.verificationService.verifyCode(
        target!,
        code!,
        CodeType.REGISTER,
      );
      if (!verifyResult.valid) {
        throw new BadRequestException(verifyResult.message);
      }
    } else {
      // 其他类型的注册方式已被禁用
      throw new BadRequestException('无效的注册方式');
    }

    // 创建用户
    const hashedPassword = password ? await this.hashPassword(password) : null;
    const now = new Date();

    const user = await this.authRepo.createUserWithProfile({
      username,
      email: email || null,
      phone,
      countryCode,
      password: hashedPassword,
      emailVerifiedAt: type === AuthType.EMAIL_CODE ? now : null,
      phoneVerifiedAt: type === AuthType.PHONE_CODE ? now : null,
      profileName: username || email?.split('@')[0] || phone || '用户',
    });

    // 记录登录日志
    await this.createLoginLog(
      user.id,
      email || phone || username!,
      this.getLoginType(type),
      true,
      ip,
      userAgent,
    );

    // 发送欢迎邮件
    if (email) {
      try {
        await this.emailService.sendWelcomeEmail(email, username || 'User');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`发送欢迎邮件失败: ${errorMessage}`);
      }
    }

    // 生成JWT令牌
    const tokens = this.generateTokens(user.id);

    return {
      user: this.formatUserResponse(user),
      ...tokens,
    };
  }

  // 用户登录
  async login(
    loginDto: LoginDto,
    ip: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const { type, username, email, phone, countryCode, password, code } =
      loginDto;
    const target = username || email || phone;

    if (!target) {
      throw new BadRequestException('请提供用户名、邮箱或手机号');
    }

    // 检查登录锁定
    await this.checkLoginLockout(target, ip);

    // 查找用户
    const user = await this.findUserByTarget(target, countryCode);
    if (!user) {
      await this.createLoginLog(
        null,
        target,
        this.getLoginType(type),
        false,
        ip,
        userAgent,
        '用户不存在',
      );
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证登录凭据
    let failureReason = '';

    try {
      if (type === AuthType.EMAIL_CODE || type === AuthType.PHONE_CODE) {
        // 验证码登录
        const verifyResult = await this.verificationService.verifyCode(
          target,
          code!,
          CodeType.LOGIN,
        );
        if (!verifyResult.valid) {
          failureReason = verifyResult.message;
          throw new UnauthorizedException(verifyResult.message);
        }
      } else {
        // 密码登录
        if (!user.password) {
          failureReason = '该账户未设置密码，请使用验证码登录';
          throw new UnauthorizedException(failureReason);
        }
        const isPasswordValid = await bcrypt.compare(password!, user.password);
        if (!isPasswordValid) {
          failureReason = '密码错误';
          throw new UnauthorizedException('用户名或密码错误');
        }
      }

      // 更新最后登录时间
      await this.authRepo.updateUserLastLoginAt(user.id, new Date());

      // 记录成功登录日志
      await this.createLoginLog(
        user.id,
        target,
        this.getLoginType(type),
        true,
        ip,
        userAgent,
      );

      // 生成JWT令牌
      const tokens = this.generateTokens(user.id);

      return {
        user: this.formatUserResponse(user),
        ...tokens,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // 记录失败登录日志
      await this.createLoginLog(
        user.id,
        target,
        this.getLoginType(type),
        false,
        ip,
        userAgent,
        failureReason || errorMessage,
      );
      throw error;
    }
  }

  // 发送验证码
  async sendCode(
    sendCodeDto: SendCodeDto,
    ip: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    const { target, type } = sendCodeDto;

    if (!target) {
      throw new BadRequestException('目标邮箱或手机号不能为空');
    }

    // 根据验证码类型进行不同的验证
    if (type === CodeType.REGISTER) {
      // 注册验证码：检查用户是否已存在
      const existingUser = await this.findUserByTarget(target);
      if (existingUser) {
        throw new ConflictException('该邮箱或手机号已被注册');
      }
    } else if (type === CodeType.LOGIN || type === CodeType.RESET_PASSWORD) {
      // 登录或重置密码验证码：检查用户是否存在
      const user = await this.findUserByTarget(target);
      if (!user) {
        throw new BadRequestException('用户不存在');
      }
    }

    return await this.verificationService.sendCode(target, type, ip, userAgent);
  }

  // 验证验证码
  async verifyCode(
    verifyCodeDto: VerifyCodeDto,
  ): Promise<{ valid: boolean; message: string }> {
    const { target, code, type } = verifyCodeDto;
    return await this.verificationService.verifyCode(target, code, type);
  }

  // 重置密码
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    ip: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    const { target, code, newPassword } = resetPasswordDto;

    // 验证验证码
    const verifyResult = await this.verificationService.verifyCode(
      target,
      code,
      CodeType.RESET_PASSWORD,
    );
    if (!verifyResult.valid) {
      throw new BadRequestException(verifyResult.message);
    }

    // 查找用户
    const user = await this.findUserByTarget(target);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 验证新密码强度
    this.validatePassword(newPassword);

    // 更新密码
    const hashedPassword = await this.hashPassword(newPassword);
    await this.authRepo.updateUserPassword(user.id, hashedPassword);

    // 记录登录日志
    await this.createLoginLog(
      user.id,
      target,
      LoginType.PASSWORD_RESET,
      true,
      ip,
      userAgent,
    );

    // 发送密码重置通知邮件
    if (user.email) {
      try {
        // 暂时使用简单的邮件发送，后续可以添加专门的密码重置通知模板
        await this.emailService.sendSimpleEmail({
          to: user.email,
          subject: 'LuLab 密码重置通知',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>密码重置通知</h2>
              <p>您好 ${typeof user.profile === 'object' && user.profile && 'name' in user.profile ? (user.profile as { name?: string }).name || 'User' : 'User'}，</p>
              <p>您的 LuLab 账户密码已成功重置。</p>
              <p>重置时间：${new Date().toLocaleString('zh-CN')}</p>
              <p>如果这不是您的操作，请立即联系我们。</p>
            </div>
          `,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`发送密码重置通知邮件失败: ${errorMessage}`);
      }
    }

    return {
      success: true,
      message: '密码重置成功',
    };
  }

  // 获取用户信息
  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.authRepo.getUserByIdWithProfile(userId);

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    return this.formatUserResponse(user);
  }

  // 更新用户资料
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    ip: string,
    userAgent?: string,
  ): Promise<UserProfileResponseDto> {
    this.logger.log(`用户 ${userId} 正在更新资料，IP: ${ip}, UA: ${userAgent}`);
    const { username, email, phone, countryCode, name, avatar, bio } =
      updateProfileDto;

    // 检查用户是否存在
    const existingUser = await this.authRepo.getUserByIdWithProfile(userId);

    if (!existingUser) {
      throw new BadRequestException('用户不存在');
    }

    // 检查用户名、邮箱、手机号的唯一性
    if (username && username !== existingUser.username) {
      const usernameExists = await this.authRepo.findUserByUsername(username);
      if (usernameExists) {
        throw new ConflictException('用户名已被使用');
      }
    }

    if (email && email !== existingUser.email) {
      const emailExists = await this.authRepo.findUserByEmail(email);
      if (emailExists) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    if (
      phone &&
      (phone !== existingUser.phone ||
        updateProfileDto.countryCode !== existingUser.countryCode)
    ) {
      const phoneExists = await this.authRepo.findUserByPhoneCombination(
        updateProfileDto.countryCode || existingUser.countryCode || '',
        phone,
      );
      if (phoneExists) {
        throw new ConflictException('手机号已被使用');
      }
    }

    // 更新用户信息
    const updatedUser = await this.authRepo.updateUserWithProfileUpsert(
      userId,
      {
        ...(username ? { username } : {}),
        email,
        phone,
        countryCode,
        profile: {
          name: name || username || email?.split('@')[0] || phone,
          avatar,
          bio,
        },
      },
    );

    return this.formatUserResponse(updatedUser);
  }

  // 刷新令牌
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.authRepo.getUserById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      const accessToken = this.jwtService.sign(
        { sub: user.id },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '15m',
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }

  // 私有方法

  private validateRegisterType(type: AuthType, registerDto: RegisterDto): void {
    const { email, phone, password, code } = registerDto;

    switch (type) {
      case AuthType.USERNAME_PASSWORD:
        // 不再支持纯用户名密码注册，必须提供邮箱或手机号进行验证
        throw new BadRequestException(
          '为了账户安全，注册需要邮箱或手机号验证，请使用邮箱验证码或手机验证码注册',
        );
      case AuthType.EMAIL_PASSWORD:
        if (!email || !password) {
          throw new BadRequestException('邮箱和密码不能为空');
        }
        this.validatePassword(password);
        // 邮箱密码注册也需要先验证邮箱
        throw new BadRequestException(
          '为了账户安全，请先通过邮箱验证码验证您的邮箱地址',
        );
      case AuthType.EMAIL_CODE:
        if (!email || !code) {
          throw new BadRequestException('邮箱和验证码不能为空');
        }
        break;
      case AuthType.PHONE_PASSWORD:
        if (!phone || !password) {
          throw new BadRequestException('手机号和密码不能为空');
        }
        this.validatePassword(password);
        // 手机密码注册也需要先验证手机号
        throw new BadRequestException(
          '为了账户安全，请先通过手机验证码验证您的手机号码',
        );
      case AuthType.PHONE_CODE:
        if (!phone || !code) {
          throw new BadRequestException('手机号和验证码不能为空');
        }
        break;
      default:
        throw new BadRequestException('不支持的注册方式');
    }
  }

  private async checkUserExists(
    username?: string,
    email?: string,
    phone?: string,
    countryCode?: string,
  ): Promise<void> {
    const conditions: Array<Record<string, unknown>> = [];
    if (username) conditions.push({ username });
    if (email) conditions.push({ email }); // 只有当email不为空时才检查
    if (phone && countryCode)
      conditions.push({ unique_phone_combination: { countryCode, phone } });

    if (conditions.length === 0) return;

    const existingUser = await this.authRepo.findFirstByConditions(conditions);

    if (existingUser) {
      if (username && existingUser.username === username) {
        throw new ConflictException('用户名已被注册');
      }
      if (email && existingUser.email === email) {
        throw new ConflictException('邮箱已被注册');
      }
      if (
        phone &&
        countryCode &&
        existingUser.phone === phone &&
        existingUser.countryCode === countryCode
      ) {
        throw new ConflictException('手机号已被注册');
      }
    }
  }

  private async findUserByTarget(
    target: string,
    countryCode?: string,
  ): Promise<(User & { profile: UserProfile | null }) | null> {
    const conditions: Array<Record<string, unknown>> = [
      { username: target },
      { email: target },
    ];

    // 如果提供了国家代码，则添加手机号查询条件
    if (countryCode) {
      conditions.push({
        unique_phone_combination: { countryCode, phone: target },
      });
    } else {
      // 如果没有国家代码，则查询所有匹配的手机号
      conditions.push({ phone: target });
    }

    return await this.authRepo.findUserByTarget(target, countryCode);
  }

  private async checkLoginLockout(target: string, ip: string): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - this.lockoutDuration);

    // 检查同一目标的失败次数
    const targetFailures = await this.authRepo.countLoginFailuresByTargetSince(
      target,
      fifteenMinutesAgo,
    );

    // 检查同一IP的失败次数
    const ipFailures = await this.authRepo.countLoginFailuresByIpSince(
      ip,
      fifteenMinutesAgo,
    );

    if (targetFailures >= this.maxLoginAttempts) {
      throw new HttpException(
        `登录失败次数过多，请${this.lockoutDuration / 60000}分钟后再试`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (ipFailures >= this.maxLoginAttempts * 2) {
      throw new HttpException(
        `该IP登录失败次数过多，请${this.lockoutDuration / 60000}分钟后再试`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async createLoginLog(
    userId: string | null,
    target: string,
    type: LoginType,
    success: boolean,
    ip: string,
    userAgent?: string,
    failureReason?: string,
  ): Promise<void> {
    await this.authRepo.createLoginLog({
      userId,
      target,
      loginType: type,
      success,
      ip,
      userAgent,
      failReason: failureReason,
    });
  }

  private generateTokens(userId: string): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private formatUserResponse(
    user: User & { profile: UserProfile | null },
  ): UserProfileResponseDto {
    return {
      id: user.id,
      username: user.username || undefined,
      email: user.email || '',
      countryCode: user.countryCode || undefined,
      phone: user.phone || undefined,
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            name: user.profile.name || undefined,
            avatar: user.profile.avatar || undefined,
            bio: user.profile.bio || undefined,
            firstName: user.profile.firstName || undefined,
            lastName: user.profile.lastName || undefined,
            dateOfBirth: user.profile.dateOfBirth || undefined,
            gender: user.profile.gender || undefined,
            city: user.profile.city || undefined,
            country: user.profile.country || undefined,
          }
        : undefined,
    };
  }

  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('密码长度至少为8位');
    }
    if (!isStrongPassword(password)) {
      throw new BadRequestException('密码必须包含大小写字母和数字');
    }
  }

  private getLoginType(authType: AuthType): LoginType {
    const typeMap = {
      [AuthType.USERNAME_PASSWORD]: LoginType.USERNAME_PASSWORD,
      [AuthType.EMAIL_PASSWORD]: LoginType.EMAIL_PASSWORD,
      [AuthType.EMAIL_CODE]: LoginType.EMAIL_CODE,
      [AuthType.PHONE_PASSWORD]: LoginType.PHONE_PASSWORD,
      [AuthType.PHONE_CODE]: LoginType.PHONE_CODE,
    };
    return typeMap[authType] || LoginType.USERNAME_PASSWORD;
  }
}
