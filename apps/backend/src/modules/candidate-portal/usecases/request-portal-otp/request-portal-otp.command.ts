import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { BaseCommand } from '@boilerplate/core';

export class RequestPortalOtpCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly orgSlug: string;

  @IsEmail()
  @MaxLength(255)
  readonly email: string;
}
