import { IsString, IsOptional } from 'class-validator';
import { BaseAuthenticatedCommand } from '@boilerplate/core';

export class LogoutCommand extends BaseAuthenticatedCommand {
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
