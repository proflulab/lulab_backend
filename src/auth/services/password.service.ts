import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerificationService } from '@/verification/verification.service';
import { CodeType } from '@/verification/enums';
import { UserRepository } from '../repositories/user.repository';
import { AuthPolicyService } from './auth-policy.service';
import { EmailService } from '@/email/email.service';
import { buildPasswordResetNotificationEmail } from '@libs/common/email-templates';
import { hashPassword, validatePassword } from './utils/password.util';
import { LoginType } from '@/auth/enums';

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly verificationService: VerificationService,
    private readonly authPolicy: AuthPolicyService,
    private readonly emailService: EmailService,
  ) {}

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    ip: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    const { target, code, newPassword } = resetPasswordDto;

    const verifyResult = await this.verificationService.verifyCode(
      target,
      code,
      CodeType.RESET_PASSWORD,
    );
    if (!verifyResult.valid) {
      throw new BadRequestException(verifyResult.message);
    }

    const user = await this.userRepo.findUserByTarget(target);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    validatePassword(newPassword);

    const hashedPassword = await hashPassword(newPassword);
    await this.userRepo.updateUserPassword(user.id, hashedPassword);

    await this.authPolicy.createLoginLog({
      userId: user.id,
      target,
      loginType: LoginType.PASSWORD_RESET,
      success: true,
      ip,
      userAgent,
    });

    if (user.email) {
      try {
        const displayName =
          typeof user.profile === 'object' &&
          user.profile &&
          'name' in user.profile
            ? (user.profile as { name?: string }).name || 'User'
            : 'User';

        const { subject, html } = buildPasswordResetNotificationEmail(
          displayName,
          new Date(),
        );

        await this.emailService.sendSimpleEmail({
          to: user.email,
          subject,
          html,
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
}
