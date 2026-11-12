import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  BaseAuthenticatedCommand,
  OrgSubscriptionStatus,
  PlanId,
} from '@boilerplate/core';

export class UpdateOrganizationBillingCommand extends BaseAuthenticatedCommand {
  @IsUUID()
  @IsNotEmpty()
  targetOrganizationId!: string;

  @IsOptional()
  @IsEnum(PlanId)
  plan?: PlanId;

  @IsOptional()
  @IsEnum(OrgSubscriptionStatus)
  status?: OrgSubscriptionStatus;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(10000)
  memberLimitOverride?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  trialEndsAt?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  subscriptionEndsAt?: string | null;
}
