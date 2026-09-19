import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class SendSignupOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}

export class VerifySignupOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp!: string;
}

export class SendSignupOtpResponseDto {
  @ApiProperty({ example: 'OTP sent successfully' })
  message!: string;

  @ApiProperty({ example: 600, description: 'OTP expiry time in seconds' })
  expiresIn!: number;
}

export class VerifySignupOtpResponseDto {
  @ApiProperty({ example: true })
  verified!: boolean;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;
}
