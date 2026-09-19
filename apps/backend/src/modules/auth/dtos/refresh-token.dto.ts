import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenBodyDto {
  @ApiProperty({
    description: 'Refresh token to obtain new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'New access token (1 hour expiry)' })
  accessToken!: string;

  @ApiProperty({ description: 'New refresh token (30 days expiry)' })
  refreshToken!: string;
}
