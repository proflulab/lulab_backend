import { Global, Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationRepository } from './repositories/verification.repository';
import { AliyunModule } from '@libs/integrations/aliyun/aliyun.module';
import { AliyunSmsService } from '@libs/integrations/aliyun/aliyun-sms.service';
import { EmailModule } from '@/email/email.module';
import { PrismaService } from '@/prisma.service';
import { VerificationController } from './verification.controller';

@Global()
@Module({
  imports: [AliyunModule, EmailModule],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    VerificationRepository,
    AliyunSmsService,
    PrismaService,
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
