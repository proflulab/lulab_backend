import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ProfileService } from './services/profile.service';
import { UserRepository } from './repositories/user.repository';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, ProfileService, UserRepository],
  exports: [UserService, ProfileService, UserRepository],
})
export class UserModule {}
