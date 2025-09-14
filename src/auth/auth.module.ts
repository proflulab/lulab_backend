import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { PasswordService } from './services/password.service';
import { ProfileService } from './services/profile.service';
import { TokenService } from './services/token.service';
import { AuthPolicyService } from './services/auth-policy.service';
import { JwtStrategy, JwtAuthGuard, JWT_USER_LOOKUP } from '@libs/security';
import { PrismaService } from '@/prisma.service';
import { EmailModule } from '@/email/email.module';
import { UserRepository } from './repositories/user.repository';
import { LoginLogRepository } from './repositories/login-log.repository';
import { JwtUserLookupService } from './services/jwt-user-lookup.service';

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
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    RegisterService,
    LoginService,
    PasswordService,
    ProfileService,
    TokenService,
    AuthPolicyService,
    JwtStrategy,
    JwtAuthGuard,
    PrismaService,
    UserRepository,
    LoginLogRepository,
    { provide: JWT_USER_LOOKUP, useClass: JwtUserLookupService },
  ],
  exports: [
    RegisterService,
    LoginService,
    PasswordService,
    ProfileService,
    TokenService,
    AuthPolicyService,
    JwtAuthGuard,
    JwtStrategy,
  ],
})
export class AuthModule {}
