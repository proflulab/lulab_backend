import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AliyunSmsService } from './aliyun-sms.service';

@Module({
  imports: [ConfigModule],
  providers: [AliyunSmsService],
  exports: [AliyunSmsService],
})
export class AliyunModule {}
