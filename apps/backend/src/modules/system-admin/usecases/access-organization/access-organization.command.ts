import { IsNotEmpty, IsUUID } from 'class-validator';

import { BaseAuthenticatedCommand } from '@boilerplate/core';

export class AccessOrganizationCommand extends BaseAuthenticatedCommand {
  @IsUUID()
  @IsNotEmpty()
  targetOrganizationId!: string;
}
