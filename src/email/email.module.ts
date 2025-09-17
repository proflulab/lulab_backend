import { Module } from '@nestjs/common';
import { MailerModule } from '../integrations/email';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [MailerModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService], // 导出服务以便其他模块使用
})
export class EmailModule {}
