import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';
import { TransformToBoolean } from '@shared/transformers/to-boolean';
import { Trim } from '@shared/transformers/trim';
import {
  InterviewStatus,
  InterviewType,
  ScorecardRecommendation,
} from '@db/enums';

export const MAX_INTERVIEWERS = 10;

export class ListInterviewsDto extends ListPaginationDto {
  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-30T23:59:59.999Z' })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ enum: InterviewStatus })
  @IsEnum(InterviewStatus)
  @IsOptional()
  status?: InterviewStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  interviewerId?: string;

  @ApiPropertyOptional({
    description: 'Interviews organised by or assigned to the current user',
  })
  @IsBoolean()
  @TransformToBoolean()
  @IsOptional()
  mine?: boolean;

  @ApiPropertyOptional({
    description:
      'Completed or past scheduled interviews missing a scorecard from an assigned interviewer',
  })
  @IsBoolean()
  @TransformToBoolean()
  @IsOptional()
  needsFeedback?: boolean;
}

export class CreateInterviewDto {
  @ApiProperty()
  @IsUUID()
  applicationId!: string;

  @ApiPropertyOptional({ example: 'Technical interview' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Trim()
  @IsOptional()
  title?: string;

  @ApiProperty({ enum: InterviewType })
  @IsEnum(InterviewType)
  type!: InterviewType;

  @ApiProperty({ example: '2026-11-14T10:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ default: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(1440)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({
    example: 'Europe/London',
    description: 'Defaults to the organization timezone',
  })
  @IsTimeZone()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(300)
  @Trim()
  @IsOptional()
  location?: string | null;

  @ApiPropertyOptional({ example: 'https://meet.example.com/abc-defg' })
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  @IsOptional()
  meetingUrl?: string | null;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_INTERVIEWERS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  interviewerIds!: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  notifyCandidate?: boolean;

  @ApiPropertyOptional({
    default: true,
    description:
      'Move the application to the first interview stage when it is still in an applied or screening stage',
  })
  @IsBoolean()
  @IsOptional()
  moveToInterviewStage?: boolean;
}

export class UpdateInterviewDto extends PartialType(
  OmitType(CreateInterviewDto, [
    'applicationId',
    'moveToInterviewStage',
  ] as const),
) {}

export class UpdateInterviewStatusDto {
  @ApiProperty({ enum: InterviewStatus })
  @IsEnum(InterviewStatus)
  status!: InterviewStatus;

  @ApiPropertyOptional({ description: 'Required when cancelling' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Trim()
  @IsOptional()
  reason?: string;
}

export class ScorecardCriterionDto {
  @ApiProperty({ example: 'Communication' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Trim()
  name!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  note?: string | null;
}

export class SubmitScorecardDto {
  @ApiPropertyOptional({
    description:
      'Defaults to the current user; submitting for someone else needs the manage permission',
  })
  @IsUUID()
  @IsOptional()
  interviewerId?: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating!: number;

  @ApiProperty({ enum: ScorecardRecommendation })
  @IsEnum(ScorecardRecommendation)
  recommendation!: ScorecardRecommendation;

  @ApiPropertyOptional({ type: [ScorecardCriterionDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ScorecardCriterionDto)
  @IsOptional()
  criteria?: ScorecardCriterionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summary?: string | null;
}

export class InterviewCandidateSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;
}

export class InterviewJobSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  reference!: string;

  @ApiPropertyOptional({ nullable: true })
  clientId!: string | null;
}

export class InterviewClientSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class InterviewApplicationSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  stage!: string;
}

export class ScorecardResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  interviewId!: string;

  @ApiProperty()
  applicationId!: string;

  @ApiProperty()
  interviewerId!: string;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  interviewer!: UserSummaryDto | null;

  @ApiProperty()
  overallRating!: number;

  @ApiProperty({ enum: ScorecardRecommendation })
  recommendation!: ScorecardRecommendation;

  @ApiProperty({ type: [ScorecardCriterionDto] })
  criteria!: ScorecardCriterionDto[];

  @ApiPropertyOptional({ nullable: true })
  summary!: string | null;

  @ApiProperty()
  submittedAt!: Date;
}

export class InterviewResponseDto {
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

  @ApiProperty({ type: [String] })
  interviewerIds!: string[];

  @ApiProperty({ type: [UserSummaryDto] })
  interviewers!: UserSummaryDto[];

  @ApiPropertyOptional({ nullable: true })
  organizerId!: string | null;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  organizer!: UserSummaryDto | null;

  @ApiProperty({ enum: InterviewStatus })
  status!: InterviewStatus;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cancelledReason!: string | null;

  @ApiProperty({ type: InterviewCandidateSummaryDto })
  candidate!: InterviewCandidateSummaryDto;

  @ApiProperty({ type: InterviewJobSummaryDto })
  job!: InterviewJobSummaryDto;

  @ApiPropertyOptional({ type: InterviewClientSummaryDto, nullable: true })
  client!: InterviewClientSummaryDto | null;

  @ApiProperty({ type: InterviewApplicationSummaryDto })
  application!: InterviewApplicationSummaryDto;

  @ApiProperty({ description: 'Scorecards from assigned interviewers' })
  scorecardCount!: number;

  @ApiProperty()
  interviewerCount!: number;

  @ApiPropertyOptional({ nullable: true })
  averageRating!: number | null;

  @ApiProperty({
    description:
      'Completed or past scheduled with at least one assigned interviewer still to submit',
  })
  feedbackDue!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class InterviewDetailResponseDto extends InterviewResponseDto {
  @ApiProperty({ type: [ScorecardResponseDto] })
  scorecards!: ScorecardResponseDto[];
}
