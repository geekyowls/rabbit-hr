import {
  IsString,
  IsOptional,
  MaxLength,
  IsUrl,
  IsEmail,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseAuthenticatedCommand } from '@boilerplate/core';
import { PdfTemplate } from '@db/enums';

export class AddressCommand {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}

export class UpdateOrganizationCommand extends BaseAuthenticatedCommand {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid website URL' })
  @MaxLength(200)
  website?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressCommand)
  address?: AddressCommand | null;

  @IsOptional()
  @IsEnum(PdfTemplate)
  pdfTemplate?: PdfTemplate;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid privacy policy URL' })
  @MaxLength(500)
  privacyPolicyUrl?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid terms and conditions URL' })
  @MaxLength(500)
  termsAndConditionsUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  showGoogleLogin?: boolean;

  @IsOptional()
  @IsBoolean()
  showAppleLogin?: boolean;

  @IsOptional()
  @IsBoolean()
  hideDietitianName?: boolean;

  @IsOptional()
  @IsBoolean()
  reEngagementEmailsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyDigestEnabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceSettingsCommand)
  invoiceSettings?: InvoiceSettingsCommand | null;
}

export class InvoiceSettingsCommand {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  prefix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  defaultNotes?: string;
}
