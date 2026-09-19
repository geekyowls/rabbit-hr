import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseAuthenticatedCommand } from '@boilerplate/core';

export class RefreshTokenCommand extends BaseAuthenticatedCommand {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;

  @IsString()
  @IsOptional()
  jti?: string;
}
