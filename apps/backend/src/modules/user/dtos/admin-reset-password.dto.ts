import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class AdminResetPasswordDto {
  @ApiProperty({
    example: false,
    required: false,
    description: 'Send new password to user via email',
  })
  @IsBoolean()
  @IsOptional()
  notifyUser?: boolean;
}
