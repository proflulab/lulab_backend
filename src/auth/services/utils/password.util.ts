import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { isStrongPassword } from '@libs/common/utils';

const SALT_ROUNDS = 12;

export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new BadRequestException('密码长度至少为8位');
  }
  if (!isStrongPassword(password)) {
    throw new BadRequestException('密码必须包含大小写字母和数字');
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}
