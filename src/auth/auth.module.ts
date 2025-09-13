import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { VerificationService } from './services/verification.service';
import { AliyunModule } from '@libs/integrations/aliyun/aliyun.module';
import { AliyunSmsService } from '@libs/integrations/aliyun/aliyun-sms.service';
import { JwtStrategy, JwtAuthGuard } from '@libs/security';
import { PrismaService } from '@/prisma.service';
import { VerificationRepository } from './repositories/verification.repository';
import { EmailModule } from '@/email/email.module';
import { AuthRepository } from './repositories/auth.repository';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
    AliyunModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    VerificationService,
    AliyunSmsService,
    JwtStrategy,
    JwtAuthGuard,
    PrismaService,
    VerificationRepository,
    AuthRepository,
  ],
  exports: [AuthService, JwtAuthGuard, JwtStrategy],
})
export class AuthModule {}
