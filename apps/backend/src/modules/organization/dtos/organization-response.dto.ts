import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PdfTemplate } from '@db/enums';
import type { OrgFeatureControls } from '@boilerplate/core';

export class AddressResponseDto {
  @ApiPropertyOptional()
  street?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  zipCode?: string;

  @ApiPropertyOptional()
  country?: string;
}

export class OrganizationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  domain!: string;

  @ApiPropertyOptional()
  logo?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  website?: string | null;

  @ApiPropertyOptional({ type: AddressResponseDto })
  address?: AddressResponseDto | null;

  @ApiProperty({ enum: PdfTemplate })
  pdfTemplate!: PdfTemplate;

  @ApiPropertyOptional()
  privacyPolicyUrl?: string | null;

  @ApiPropertyOptional()
  termsAndConditionsUrl?: string | null;

  @ApiPropertyOptional()
  clientAppConfig?: {
    showGoogleLogin?: boolean;
    showAppleLogin?: boolean;
    hideDietitianName?: boolean;
  } | null;

  @ApiPropertyOptional()
  featureControls?: OrgFeatureControls | null;

  @ApiPropertyOptional()
  invoiceSettings?: {
    prefix?: string;
    defaultNotes?: string;
  } | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
