import { BaseCommand } from '@boilerplate/core';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateUserCommand extends BaseCommand {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsUUID()
  @IsNotEmpty()
  createdBy!: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsString()
  @MinLength(8)
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

  @IsBoolean()
  @IsOptional()
  notifyUser?: boolean;
}
