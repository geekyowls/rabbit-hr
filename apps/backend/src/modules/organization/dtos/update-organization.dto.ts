import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { PdfTemplate } from '@db/enums';

export class AddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}

export class UpdateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string | null;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string | null;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid website URL' })
  @MaxLength(200)
  website?: string | null;

  @ApiPropertyOptional({ description: 'Address information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto | null;

  @ApiPropertyOptional({
    description: 'PDF template for diet plans',
    enum: PdfTemplate,
  })
  @IsOptional()
  @IsEnum(PdfTemplate)
  pdfTemplate?: PdfTemplate;

  @ApiPropertyOptional({
    description: 'Privacy policy URL for client app web view',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid privacy policy URL' })
  @MaxLength(500)
  privacyPolicyUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Terms and conditions URL for client app web view',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid terms and conditions URL' })
  @MaxLength(500)
  termsAndConditionsUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Show Google login option in client mobile app',
  })
  @IsOptional()
  @IsBoolean()
  showGoogleLogin?: boolean;

  @ApiPropertyOptional({
    description: 'Show Apple login option in client mobile app',
  })
  @IsOptional()
  @IsBoolean()
  showAppleLogin?: boolean;

  @ApiPropertyOptional({
    description: 'Hide dietitian name on client profile card in mobile app',
  })
  @IsOptional()
  @IsBoolean()
  hideDietitianName?: boolean;

  @ApiPropertyOptional({
    description:
      'Send re-engagement emails to users inactive for 2+ days (defaults true)',
  })
  @IsOptional()
  @IsBoolean()
  reEngagementEmailsEnabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Send daily digest emails to users with the digest permission (defaults true)',
  })
  @IsOptional()
  @IsBoolean()
  dailyDigestEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Invoice settings (prefix and default notes)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceSettingsDto)
  invoiceSettings?: InvoiceSettingsDto | null;
}

export class InvoiceSettingsDto {
  @ApiPropertyOptional({
    description: 'Invoice number prefix (e.g. INV, NC, BILL)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  prefix?: string;

  @ApiPropertyOptional({
    description: 'Default notes/footer text for invoices',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  defaultNotes?: string;
}
