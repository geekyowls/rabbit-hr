import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PasswordResetBodyDto {
  @ApiProperty({ example: 'NewSecurePass123!', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password!: string;

  @ApiProperty({ example: 'reset-token-uuid' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  token!: string;
}

export class PasswordResetRequestBodyDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
