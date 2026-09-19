import { BaseCommand } from '@boilerplate/core';
import { IsDefined, IsEmail } from 'class-validator';

export class SendSignupOtpCommand extends BaseCommand {
  @IsEmail()
  @IsDefined()
  email!: string;
}
