import { BaseCommand } from '@boilerplate/core';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UserRegisterCommand extends BaseCommand {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsDefined()
  @IsString()
  @MinLength(8)
  password!: string;

  @IsDefined()
  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  phoneCountryCode?: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  organizationName!: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}
