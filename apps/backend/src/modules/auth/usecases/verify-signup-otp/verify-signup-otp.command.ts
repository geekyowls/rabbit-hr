import { BaseCommand } from '@boilerplate/core';
import { IsDefined, IsEmail, IsString, Length } from 'class-validator';

export class VerifySignupOtpCommand extends BaseCommand {
  @IsEmail()
  @IsDefined()
  email!: string;

  @IsString()
  @IsDefined()
  @Length(6, 6)
  otp!: string;
}
