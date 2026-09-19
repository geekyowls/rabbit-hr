import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginBodyDto {
  @ApiProperty({ description: 'Google OAuth access token from frontend' })
  @IsNotEmpty()
  @IsString()
  accessToken!: string;
}

export class GoogleLoginResponseDto {
  @ApiProperty({ description: 'Access token (1 hour expiry)' })
  accessToken!: string;

  @ApiProperty({ description: 'Refresh token (30 days expiry)' })
  refreshToken!: string;

  @ApiProperty({ description: 'Whether org is system org (for redirect)' })
  isSystemOrg!: boolean;

  @ApiProperty({ description: 'Whether the account was just created' })
  isNewUser!: boolean;
}
