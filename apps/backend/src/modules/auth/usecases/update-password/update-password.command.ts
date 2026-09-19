import { BaseAuthenticatedCommand } from '@boilerplate/core';
import { IsDefined, IsString, MinLength } from 'class-validator';

export class UpdatePasswordCommand extends BaseAuthenticatedCommand {
  @IsDefined()
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @IsDefined()
  @IsString()
  @MinLength(8)
  confirmPassword!: string;

  @IsDefined()
  @IsString()
  currentPassword!: string;
}
