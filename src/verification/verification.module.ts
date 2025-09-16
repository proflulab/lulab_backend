import { Global, Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationRepository } from './repositories/verification.repository';
import { AliyunModule } from '@libs/integrations/aliyun/aliyun.module';
import { EmailModule } from '@/email/email.module';
import { VerificationController } from './verification.controller';

@Global()
@Module({
  imports: [AliyunModule, EmailModule],
  controllers: [VerificationController],
  providers: [VerificationService, VerificationRepository],
  exports: [VerificationService],
})
export class VerificationModule {}
