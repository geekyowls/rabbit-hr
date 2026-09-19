import { IsEnum, IsOptional, IsString } from 'class-validator';

import { BasePaginatedCommand } from '@boilerplate/core';
import { OrganizationStatus, OrgSubscriptionStatus } from '@db/enums';

export class ListOrganizationsCommand extends BasePaginatedCommand {
  @IsEnum(OrganizationStatus)
  @IsOptional()
  status?: OrganizationStatus;

  @IsEnum(OrgSubscriptionStatus)
  @IsOptional()
  subscriptionStatus?: OrgSubscriptionStatus;

  @IsString()
  @IsOptional()
  search?: string;
}
