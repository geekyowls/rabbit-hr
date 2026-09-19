import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ description: 'Access token (1 hour expiry)' })
  accessToken!: string;

  @ApiProperty({ description: 'Refresh token (30 days expiry)' })
  refreshToken!: string;

  @ApiProperty({ description: 'Whether org is system org (for redirect)' })
  isSystemOrg!: boolean;
}

class RegisterUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty({ required: false })
  lastName?: string | null;

  @ApiProperty()
  organizationId!: string;
}

class RegisterOrganizationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  isSystemOrg!: boolean;
}

export class RegisterResponseDto {
  @ApiProperty({ type: RegisterUserDto, required: false })
  user?: RegisterUserDto;

  @ApiProperty({ type: RegisterOrganizationDto, required: false })
  organization?: RegisterOrganizationDto;

  @ApiProperty({
    required: false,
    description: 'True when signup is captured as a waitlist lead',
  })
  waitlistMode?: boolean;
}
