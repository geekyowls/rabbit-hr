import { IsEnum, IsIn } from 'class-validator';
import {
  BillingInterval,
  PlanId,
  SELF_SERVE_PLAN_IDS,
} from '@boilerplate/core';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class CreateCheckoutCommand extends OrganizationCommand {
  @IsIn(SELF_SERVE_PLAN_IDS)
  readonly plan: PlanId;

  @IsEnum(BillingInterval)
  readonly interval: BillingInterval;
}
