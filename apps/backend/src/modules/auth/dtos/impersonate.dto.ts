import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, MinLength } from 'class-validator';

export class ImpersonateBodyDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  targetUserId!: string;

  @ApiProperty({ description: 'Your current password for verification' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password!: string;
}
