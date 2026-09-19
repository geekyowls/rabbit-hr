import { IsEmail, IsNotEmpty } from 'class-validator';
import { BaseAuthenticatedCommand } from '@boilerplate/core';

export class ResetLoginLockoutCommand extends BaseAuthenticatedCommand {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
