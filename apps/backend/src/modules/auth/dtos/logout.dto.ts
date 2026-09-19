import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class LogoutBodyDto {
  @ApiProperty({
    description: 'Refresh token to invalidate (optional)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

export class LogoutResponseDto {
  @ApiProperty({ description: 'Logout success status' })
  success!: boolean;

  @ApiProperty({ description: 'Logout message' })
  message!: string;
}
