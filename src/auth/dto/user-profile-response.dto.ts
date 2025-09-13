import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false, nullable: true })
  username?: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false, nullable: true })
  countryCode?: string;

  @ApiProperty({ required: false, nullable: true })
  phone?: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  phoneVerified: boolean;

  @ApiProperty({ required: false, nullable: true, type: String, format: 'date-time' })
  lastLoginAt?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ required: false, nullable: true })
  profile?: {
    name?: string;
    avatar?: string;
    bio?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: string;
    city?: string;
    country?: string;
  };
}

