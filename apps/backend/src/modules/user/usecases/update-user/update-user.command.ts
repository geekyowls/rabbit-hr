import { BaseAuthenticatedCommand } from '@boilerplate/core';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateUserCommand extends BaseAuthenticatedCommand {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsUUID()
  @IsOptional()
  currentUserId?: string;

  @IsUUID()
  @IsOptional()
  currentUserRoleId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
