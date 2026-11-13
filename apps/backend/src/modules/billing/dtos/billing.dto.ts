import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  BillingAccess,
  BillingInterval,
  OrgSubscriptionStatus,
  PlanFeature,
  PlanId,
  SELF_SERVE_PLAN_IDS,
} from '@boilerplate/core';

export class SelectPlanDto {
  @ApiProperty({ enum: SELF_SERVE_PLAN_IDS })
  @IsIn(SELF_SERVE_PLAN_IDS)
  plan: PlanId;

  @ApiProperty({ enum: BillingInterval })
  @IsEnum(BillingInterval)
  interval: BillingInterval;
}

export class SyncSubscriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;
}

export class BillingUsageDto {
  @ApiProperty()
  count: number;

  @ApiPropertyOptional({ nullable: true })
  limit: number | null;
}

export class CheckoutOptionDto {
  @ApiProperty({ enum: PlanId })
  plan: PlanId;

  @ApiProperty({ enum: BillingInterval })
  interval: BillingInterval;
}

export class BillingSummaryDto {
  @ApiProperty()
  configured: boolean;

  @ApiProperty()
  enforced: boolean;

  @ApiProperty()
  isSystemOrg: boolean;

  @ApiPropertyOptional({ enum: PlanId, nullable: true })
  plan: PlanId | null;

  @ApiPropertyOptional({ enum: PlanId, nullable: true })
  effectivePlan: PlanId | null;

  @ApiPropertyOptional({ enum: BillingInterval, nullable: true })
  billingInterval: BillingInterval | null;

  @ApiProperty({ enum: OrgSubscriptionStatus })
  status: OrgSubscriptionStatus;

  @ApiProperty({ enum: BillingAccess })
  access: BillingAccess;

  @ApiPropertyOptional({ nullable: true })
  trialEndsAt: string | null;

  @ApiPropertyOptional({ nullable: true })
  currentPeriodEnd: string | null;

  @ApiPropertyOptional({ nullable: true })
  pastDueSince: string | null;

  @ApiProperty()
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ enum: PlanFeature, isArray: true })
  features: PlanFeature[];

  @ApiProperty({ type: BillingUsageDto })
  members: BillingUsageDto;

  @ApiProperty({ type: BillingUsageDto })
  activeJobs: BillingUsageDto;

  @ApiProperty()
  overLimit: boolean;

  @ApiProperty()
  hasSubscription: boolean;

  @ApiProperty()
  hasCustomer: boolean;

  @ApiProperty({ type: CheckoutOptionDto, isArray: true })
  checkoutOptions: CheckoutOptionDto[];
}

export class BillingRedirectDto {
  @ApiProperty()
  url: string;
}
