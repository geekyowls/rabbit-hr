import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { BaseCommand } from '@boilerplate/core';

export class VerifyPortalOtpCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly orgSlug: string;

  @IsEmail()
  @MaxLength(255)
  readonly email: string;

  @Matches(/^\d{6}$/)
  readonly code: string;

  @IsString()
  @IsOptional()
  readonly userAgent?: string;

  @IsString()
  @IsOptional()
  readonly ipAddress?: string;
}
