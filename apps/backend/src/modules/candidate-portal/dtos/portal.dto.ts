import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Trim } from '@shared/transformers/trim';
import {
  DocumentType,
  DocumentVerificationStatus,
  InterviewStatus,
  InterviewType,
  PipelineStageCategory,
} from '@db/enums';

export const PORTAL_UPLOAD_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'jpg',
  'jpeg',
  'png',
] as const;
export type PortalUploadExtension = (typeof PORTAL_UPLOAD_EXTENSIONS)[number];
export const PORTAL_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

const lowerEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const nullableText = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export class RequestPortalOtpDto {
  @ApiProperty({ example: 'amelia.hughes@example.com' })
  @Transform(lowerEmail)
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class VerifyPortalOtpDto extends RequestPortalOtpDto {
  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'Enter the 6 digit code' })
  code!: string;
}

export class PortalRefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  refreshToken!: string;
}

export class WithdrawPortalApplicationDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(nullableText)
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string | null;
}

export class PortalUploadUrlDto {
  @ApiProperty({ enum: PORTAL_UPLOAD_EXTENSIONS })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(PORTAL_UPLOAD_EXTENSIONS)
  extension!: PortalUploadExtension;

  @ApiProperty({ maximum: PORTAL_UPLOAD_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(PORTAL_UPLOAD_MAX_BYTES)
  sizeBytes!: number;
}

export class CreatePortalDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type!: DocumentType;

  @ApiPropertyOptional({ example: 'Passport' })
  @Trim()
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileKey!: string;

  @ApiProperty({ example: 'passport.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiPropertyOptional({ example: 204800 })
  @IsInt()
  @Min(0)
  @Max(PORTAL_UPLOAD_MAX_BYTES)
  @IsOptional()
  sizeBytes?: number;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  applicationId?: string;
}

export class UpdatePortalProfileDto {
  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(nullableText)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Matches(/^\+?[0-9\s().-]{6,40}$/, { message: 'Enter a valid phone number' })
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(nullableText)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(200)
  location?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(nullableText)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(250)
  headline?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(nullableText)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Matches(/^https?:\/\/\S+$/i, { message: 'Enter a full link with https://' })
  @MaxLength(300)
  linkedinUrl?: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, unknown>;
}

export class PortalBrandingDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  logo!: string | null;

  @ApiPropertyOptional({ nullable: true })
  website!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '#3F6650' })
  brandColor!: string | null;

  @ApiProperty()
  welcomeMessage!: string;

  @ApiProperty()
  portalEnabled!: boolean;
}

export class PortalOtpRequestedDto {
  @ApiProperty()
  sent!: boolean;

  @ApiProperty({ example: 600 })
  expiresIn!: number;
}

export class PortalTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class PortalCustomFieldDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty({ type: [String] })
  options!: string[];

  @ApiProperty()
  required!: boolean;
}

export class PortalProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiPropertyOptional({ nullable: true })
  headline!: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkedinUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cvFileName!: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  customFields!: Record<string, unknown>;
}

export class PortalMeDto {
  @ApiProperty({ type: PortalProfileDto })
  candidate!: PortalProfileDto;

  @ApiProperty({ type: PortalBrandingDto })
  organization!: PortalBrandingDto;

  @ApiProperty({ type: [PortalCustomFieldDto] })
  customFields!: PortalCustomFieldDto[];
}

export class PortalAuthResponseDto extends PortalTokensDto {
  @ApiProperty({ type: PortalProfileDto })
  candidate!: PortalProfileDto;

  @ApiProperty({ type: PortalBrandingDto })
  organization!: PortalBrandingDto;
}

export class PortalApplicationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  jobId!: string;

  @ApiProperty()
  jobTitle!: string;

  @ApiProperty()
  jobReference!: string;

  @ApiPropertyOptional({ nullable: true })
  jobLocation!: string | null;

  @ApiProperty()
  employmentType!: string;

  @ApiProperty()
  workMode!: string;

  @ApiProperty({ enum: PipelineStageCategory })
  status!: PipelineStageCategory;

  @ApiProperty({ example: 'In review' })
  statusLabel!: string;

  @ApiProperty()
  isClosed!: boolean;

  @ApiProperty()
  appliedAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PortalInterviewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  applicationId!: string;

  @ApiPropertyOptional({ nullable: true })
  jobTitle!: string | null;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: InterviewType })
  type!: InterviewType;

  @ApiProperty()
  scheduledAt!: Date;

  @ApiProperty()
  durationMinutes!: number;

  @ApiProperty()
  timezone!: string;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiPropertyOptional({ nullable: true })
  meetingUrl!: string | null;

  @ApiProperty({ enum: InterviewStatus })
  status!: InterviewStatus;

  @ApiProperty()
  isUpcoming!: boolean;
}

export class PortalBookingLinkDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  applicationId!: string;

  @ApiPropertyOptional({ nullable: true })
  jobTitle!: string | null;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: InterviewType })
  type!: InterviewType;

  @ApiProperty()
  durationMinutes!: number;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty()
  token!: string;
}

export class PortalOfferDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  applicationId!: string;

  @ApiPropertyOptional({ nullable: true })
  jobTitle!: string | null;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  salaryAmount!: number | null;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  salaryPeriod!: string;

  @ApiPropertyOptional({ nullable: true })
  bonus!: string | null;

  @ApiPropertyOptional({ nullable: true })
  startDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  expiresAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  employmentType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sentAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  respondedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  signedAt!: Date | null;

  @ApiProperty({
    enum: [
      'not_sent',
      'pending',
      'signed',
      'accepted',
      'declined',
      'expired',
      'closed',
    ],
  })
  signStatus!: string;

  @ApiPropertyOptional({ nullable: true })
  signToken!: string | null;
}

export class PortalDocumentDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  applicationId!: string | null;

  @ApiProperty({ enum: DocumentType })
  type!: DocumentType;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  fileName!: string;

  @ApiPropertyOptional({ nullable: true })
  mimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sizeBytes!: number | null;

  @ApiProperty({ enum: DocumentVerificationStatus })
  verificationStatus!: DocumentVerificationStatus;

  @ApiPropertyOptional({ nullable: true })
  expiresAt!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class PortalDocumentRequestDto {
  @ApiProperty({ enum: DocumentType })
  type!: DocumentType;

  @ApiProperty({ type: [String] })
  jobTitles!: string[];

  @ApiProperty({ type: [String] })
  applicationIds!: string[];
}

export class PortalDocumentsDto {
  @ApiProperty({ type: [PortalDocumentDto] })
  documents!: PortalDocumentDto[];

  @ApiProperty({ type: [PortalDocumentRequestDto] })
  requests!: PortalDocumentRequestDto[];
}

export class PortalOverviewDto {
  @ApiProperty({ type: [PortalApplicationDto] })
  applications!: PortalApplicationDto[];

  @ApiProperty({ type: [PortalInterviewDto] })
  upcomingInterviews!: PortalInterviewDto[];

  @ApiProperty({ type: [PortalOfferDto] })
  pendingOffers!: PortalOfferDto[];

  @ApiProperty({ type: [PortalDocumentRequestDto] })
  documentRequests!: PortalDocumentRequestDto[];

  @ApiProperty({ type: [PortalBookingLinkDto] })
  bookingLinks!: PortalBookingLinkDto[];
}

export class PortalTimelineStepDto {
  @ApiProperty({ enum: PipelineStageCategory })
  status!: PipelineStageCategory;

  @ApiProperty()
  label!: string;

  @ApiProperty({ enum: ['done', 'current', 'upcoming'] })
  state!: 'done' | 'current' | 'upcoming';

  @ApiPropertyOptional({ nullable: true })
  reachedAt!: Date | null;
}

export class PortalApplicationDetailDto extends PortalApplicationDto {
  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  salaryMin!: number | null;

  @ApiPropertyOptional({ nullable: true })
  salaryMax!: number | null;

  @ApiPropertyOptional({ nullable: true })
  payRate!: number | null;

  @ApiPropertyOptional({ nullable: true })
  rateUnit!: string | null;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  canWithdraw!: boolean;

  @ApiProperty({ type: [PortalTimelineStepDto] })
  timeline!: PortalTimelineStepDto[];

  @ApiProperty({ type: [PortalInterviewDto] })
  interviews!: PortalInterviewDto[];

  @ApiProperty({ type: [PortalOfferDto] })
  offers!: PortalOfferDto[];

  @ApiProperty({ type: [PortalBookingLinkDto] })
  bookingLinks!: PortalBookingLinkDto[];
}

export class PortalInterviewsDto {
  @ApiProperty({ type: [PortalInterviewDto] })
  upcoming!: PortalInterviewDto[];

  @ApiProperty({ type: [PortalInterviewDto] })
  past!: PortalInterviewDto[];

  @ApiProperty({ type: [PortalBookingLinkDto] })
  bookingLinks!: PortalBookingLinkDto[];
}

export class PortalUploadUrlResponseDto {
  @ApiProperty()
  signedUrl!: string;

  @ApiProperty()
  key!: string;
}

export class PortalDownloadUrlDto {
  @ApiProperty()
  url!: string;
}

export class PortalInviteResponseDto {
  @ApiProperty()
  sent!: boolean;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty()
  portalInvitedAt!: Date;

  @ApiProperty()
  loginUrl!: string;
}
