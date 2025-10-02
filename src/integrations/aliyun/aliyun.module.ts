import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AliyunSmsService } from './aliyun-sms.service';
import { aliyunConfig } from '../../configs/aliyun.config';

@Module({
  imports: [ConfigModule.forFeature(aliyunConfig)],
  providers: [AliyunSmsService],
  exports: [AliyunSmsService],
})
export class AliyunModule {}
