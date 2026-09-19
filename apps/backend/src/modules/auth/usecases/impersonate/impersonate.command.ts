import { BaseAuthenticatedCommand } from '@boilerplate/core';
import { IsNotEmpty, IsUUID, IsString, MinLength } from 'class-validator';

export class ImpersonateCommand extends BaseAuthenticatedCommand {
  @IsUUID()
  @IsNotEmpty()
  targetUserId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password!: string;
}
