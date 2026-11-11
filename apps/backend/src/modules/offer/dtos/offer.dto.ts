import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsISO4217CurrencyCode,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';
import { Trim } from '@shared/transformers/trim';
import {
  EmploymentType,
  OfferDecision,
  OfferResponse,
  OfferStatus,
  SalaryPeriod,
} from '@db/enums';

export const MAX_APPROVERS = 10;

export class ListOffersDto extends ListPaginationDto {
  @ApiPropertyOptional({ enum: OfferStatus })
  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Candidate, job or offer title' })
  @IsString()
  @MaxLength(200)
  @Trim()
  @IsOptional()
  search?: string;
}

export class CreateOfferDto {
  @ApiProperty()
  @IsUUID()
  applicationId!: string;

  @ApiPropertyOptional({ description: 'Defaults to the job title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Trim()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 42000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  salaryAmount?: number | null;

  @ApiPropertyOptional({
    example: 'GBP',
    description: 'Defaults to the organization currency',
  })
  @IsISO4217CurrencyCode()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ enum: SalaryPeriod })
  @IsEnum(SalaryPeriod)
  @IsOptional()
  salaryPeriod?: SalaryPeriod;

  @ApiPropertyOptional({ example: '10% annual performance bonus' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  bonus?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  equity?: string | null;

  @ApiPropertyOptional({ example: '2026-12-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @ApiPropertyOptional({ example: '2026-11-25' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string | null;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType | null;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(200)
  @IsOptional()
  location?: string | null;

  @ApiPropertyOptional({
    description:
      'Offer letter. Defaults to the offer email template rendered with merge fields',
  })
  @IsString()
  @IsOptional()
  body?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayMaxSize(MAX_APPROVERS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  approverIds?: string[];
}

export class UpdateOfferDto extends PartialType(
  OmitType(CreateOfferDto, ['applicationId'] as const),
) {}

export class OfferDecisionDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(1000)
  @Trim()
  @IsOptional()
  comment?: string;
}

export class RespondOfferDto {
  @ApiProperty({ enum: OfferResponse })
  @IsEnum(OfferResponse)
  response!: OfferResponse;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(500)
  @Trim()
  @IsOptional()
  reason?: string;
}

export class WithdrawOfferDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(500)
  @Trim()
  @IsOptional()
  reason?: string;
}

export class OfferApprovalDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: OfferDecision })
  decision!: OfferDecision;

  @ApiPropertyOptional({ nullable: true })
  comment!: string | null;

  @ApiProperty()
  decidedAt!: string;
}

export class OfferApproverDto extends UserSummaryDto {
  @ApiPropertyOptional({ enum: OfferDecision, nullable: true })
  decision!: OfferDecision | null;

  @ApiPropertyOptional({ nullable: true })
  comment!: string | null;

  @ApiPropertyOptional({ nullable: true })
  decidedAt!: string | null;
}

export class OfferCandidateSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;
}

export class OfferJobSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  reference!: string;

  @ApiPropertyOptional({ nullable: true })
  department!: string | null;

  @ApiPropertyOptional({ nullable: true })
  clientId!: string | null;
}

export class OfferClientSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class OfferApplicationSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  stage!: string;
}

export class OfferResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  applicationId!: string;

  @ApiProperty()
  candidateId!: string;

  @ApiProperty()
  jobId!: string;

  @ApiProperty({ enum: OfferStatus })
  status!: OfferStatus;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  salaryAmount!: number | null;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: SalaryPeriod })
  salaryPeriod!: SalaryPeriod;

  @ApiPropertyOptional({ nullable: true })
  bonus!: string | null;

  @ApiPropertyOptional({ nullable: true })
  equity!: string | null;

  @ApiPropertyOptional({ nullable: true })
  startDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  expiresAt!: string | null;

  @ApiPropertyOptional({ enum: EmploymentType, nullable: true })
  employmentType!: EmploymentType | null;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiPropertyOptional({ nullable: true })
  body!: string | null;

  @ApiProperty({ type: [String] })
  approverIds!: string[];

  @ApiProperty({ type: [OfferApprovalDto] })
  approvals!: OfferApprovalDto[];

  @ApiProperty({ type: [OfferApproverDto] })
  approvers!: OfferApproverDto[];

  @ApiPropertyOptional({ nullable: true })
  sentAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  respondedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  declineReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: string | null;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  creator!: UserSummaryDto | null;

  @ApiProperty({ type: OfferCandidateSummaryDto })
  candidate!: OfferCandidateSummaryDto;

  @ApiProperty({ type: OfferJobSummaryDto })
  job!: OfferJobSummaryDto;

  @ApiPropertyOptional({ type: OfferClientSummaryDto, nullable: true })
  client!: OfferClientSummaryDto | null;

  @ApiProperty({ type: OfferApplicationSummaryDto })
  application!: OfferApplicationSummaryDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
