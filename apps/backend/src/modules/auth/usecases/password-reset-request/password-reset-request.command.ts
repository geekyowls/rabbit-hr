import { BaseCommand } from '@boilerplate/core';
import { IsDefined, IsEmail } from 'class-validator';

export class PasswordResetRequestCommand extends BaseCommand {
  @IsEmail()
  @IsDefined()
  email!: string;
}
