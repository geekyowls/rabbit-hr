import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AGENCY_SIZES, type AgencySize } from '@boilerplate/core';

export class UpdateOnboardingContextBodyDto {
  @ApiProperty({ enum: AGENCY_SIZES })
  @IsIn(AGENCY_SIZES)
  agencySize!: AgencySize;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  organizationName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8)
  phoneCountryCode?: string;
}
