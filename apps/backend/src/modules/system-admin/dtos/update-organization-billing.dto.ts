import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { OrgSubscriptionStatus, PlanId } from '@boilerplate/core';

export class UpdateOrganizationBillingDto {
  @ApiPropertyOptional({ enum: PlanId })
  @IsOptional()
  @IsEnum(PlanId)
  plan?: PlanId;

  @ApiPropertyOptional({ enum: OrgSubscriptionStatus })
  @IsOptional()
  @IsEnum(OrgSubscriptionStatus)
  status?: OrgSubscriptionStatus;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Null uses the plan default',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(10000)
  memberLimitOverride?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  trialEndsAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  subscriptionEndsAt?: string | null;
}
