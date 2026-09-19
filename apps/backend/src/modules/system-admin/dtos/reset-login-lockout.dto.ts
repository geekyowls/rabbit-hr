import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetLoginLockoutDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
