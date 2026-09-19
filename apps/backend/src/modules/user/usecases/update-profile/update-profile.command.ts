import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { BaseAuthenticatedCommand } from '@boilerplate/core';

export class UpdateProfileCommand extends BaseAuthenticatedCommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string | null;
}
