import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { BasePaginatedCommand } from '@boilerplate/core';
import { UserStatus } from '@db/enums';

export class ListUsersCommand extends BasePaginatedCommand {
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  invitedBy?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
