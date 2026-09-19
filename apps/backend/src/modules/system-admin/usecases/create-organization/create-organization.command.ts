import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { BaseAuthenticatedCommand } from '@boilerplate/core';

export class CreateOrganizationCommand extends BaseAuthenticatedCommand {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail!: string;

  @IsString()
  @IsNotEmpty()
  adminFirstName!: string;

  @IsString()
  @IsOptional()
  adminLastName?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  adminPassword!: string;

  @IsString()
  @IsOptional()
  logo?: string;
}
