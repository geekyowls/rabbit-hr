import {
  AGENCY_SIZES,
  BaseAuthenticatedCommand,
  type AgencySize,
} from '@boilerplate/core';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOnboardingContextCommand extends BaseAuthenticatedCommand {
  @IsIn(AGENCY_SIZES)
  agencySize!: AgencySize;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  organizationName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsString()
  phoneCountryCode?: string;
}
