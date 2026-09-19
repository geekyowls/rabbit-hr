import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginBodyDto {
  @ApiProperty({ example: 'admin@acme-corp.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(72)
  password!: string;
}
