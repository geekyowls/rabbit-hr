import { BaseCommand } from '@boilerplate/core';
import { IsDefined, IsString, MinLength } from 'class-validator';

export class PasswordResetCommand extends BaseCommand {
  @IsString()
  @IsDefined()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsDefined()
  token!: string;
}
