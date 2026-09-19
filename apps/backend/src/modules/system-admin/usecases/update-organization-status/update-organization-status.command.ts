import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

import { BaseAuthenticatedCommand } from '@boilerplate/core';
import { OrganizationStatus } from '@db/enums';

export class UpdateOrganizationStatusCommand extends BaseAuthenticatedCommand {
  @IsUUID()
  @IsNotEmpty()
  targetOrganizationId!: string;

  @IsEnum(OrganizationStatus)
  @IsNotEmpty()
  status!: OrganizationStatus;
}
