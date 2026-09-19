import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
    description: 'Role ID to assign to the user',
  })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiProperty({
    example: 'SecureP@ss123!',
    required: false,
    description:
      'Password for the user. If not provided, a random password will be generated.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @ValidateIf((o) => o.password)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  @IsOptional()
  password?: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Send login credentials to user via email',
  })
  @IsBoolean()
  @IsOptional()
  notifyUser?: boolean;
}
