import { IsOptional, IsUUID } from 'class-validator';
import { BaseAuthenticatedCommand } from '@boilerplate/core';

export class SyncRolePermissionsCommand extends BaseAuthenticatedCommand {
  @IsOptional()
  @IsUUID()
  targetOrganizationId?: string;
}
