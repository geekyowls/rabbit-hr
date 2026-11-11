import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';
import { CandidateSource, PipelineStageCategory } from '@db/enums';

export const TIME_TO_HIRE_METHOD = 'applied_at_to_first_hired_stage_entry';

export class ReportSummaryQueryDto {
  @ApiPropertyOptional({ description: 'Defaults to 90 days before `to`' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'Defaults to now' })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Job recruiter, falling back to the job owner',
  })
  @IsUUID()
  @IsOptional()
  recruiterId?: string;
}

export class ReportRangeDto {
  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;
}

export class ReportTotalsDto {
  @ApiProperty({ description: 'Applications received in range' })
  applications!: number;

  @ApiProperty({
    description: 'Applications that entered a hired stage in range',
  })
  hires!: number;

  @ApiProperty()
  interviews!: number;

  @ApiProperty()
  offersSent!: number;
}

export class TimeToHireDto {
  @ApiProperty({
    example: TIME_TO_HIRE_METHOD,
    description:
      'Days from application appliedAt to the first stage_change activity into a hired category stage, falling back to stageChangedAt when no history exists',
  })
  method!: string;

  @ApiProperty()
  hires!: number;

  @ApiPropertyOptional({ nullable: true })
  medianDays!: number | null;

  @ApiPropertyOptional({ nullable: true })
  averageDays!: number | null;
}

export class TimeInStageDto {
  @ApiProperty()
  stage!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: PipelineStageCategory })
  category!: PipelineStageCategory;

  @ApiProperty({
    description: 'Completed stage visits measured from stage_change history',
  })
  samples!: number;

  @ApiPropertyOptional({ nullable: true })
  medianDays!: number | null;

  @ApiPropertyOptional({ nullable: true })
  averageDays!: number | null;
}

export class FunnelStageDto {
  @ApiProperty()
  stage!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: PipelineStageCategory })
  category!: PipelineStageCategory;

  @ApiProperty({
    description:
      'Applications in range that reached this stage or a later funnel stage, from stage_change history and the current stage',
  })
  reached!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Percent of this stage that reached the next funnel stage',
  })
  conversionToNext!: number | null;
}

export class SourceReportDto {
  @ApiProperty({ enum: CandidateSource })
  source!: CandidateSource;

  @ApiProperty()
  applications!: number;

  @ApiProperty()
  hires!: number;

  @ApiPropertyOptional({ nullable: true })
  hireRate!: number | null;
}

export class WeeklyBucketDto {
  @ApiProperty({ example: '2026-11-09' })
  weekStart!: string;

  @ApiProperty()
  applications!: number;

  @ApiProperty()
  hires!: number;
}

export class OfferReportDto {
  @ApiProperty()
  created!: number;

  @ApiProperty()
  sent!: number;

  @ApiProperty()
  accepted!: number;

  @ApiProperty()
  declined!: number;

  @ApiProperty()
  pendingApproval!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Accepted as a percent of accepted plus declined',
  })
  acceptanceRate!: number | null;
}

export class InterviewReportDto {
  @ApiProperty({ description: 'Interviews scheduled to take place in range' })
  scheduled!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty()
  cancelled!: number;

  @ApiProperty()
  noShow!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'No shows as a percent of completed plus no shows',
  })
  noShowRate!: number | null;

  @ApiProperty()
  scorecards!: number;

  @ApiPropertyOptional({ nullable: true })
  averageRating!: number | null;
}

export class RecruiterReportDto {
  @ApiProperty({ type: UserSummaryDto })
  recruiter!: UserSummaryDto;

  @ApiProperty()
  jobs!: number;

  @ApiProperty()
  applications!: number;

  @ApiProperty()
  interviews!: number;

  @ApiProperty()
  offers!: number;

  @ApiProperty()
  hires!: number;
}

export class RejectionReasonDto {
  @ApiProperty()
  reason!: string;

  @ApiProperty()
  count!: number;
}

export class ClientReportDto {
  @ApiPropertyOptional({ nullable: true })
  clientId!: string | null;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  applications!: number;

  @ApiProperty()
  hires!: number;
}

export class ReportSummaryResponseDto {
  @ApiProperty({ type: ReportRangeDto })
  range!: ReportRangeDto;

  @ApiProperty({ type: ReportTotalsDto })
  totals!: ReportTotalsDto;

  @ApiProperty({ type: TimeToHireDto })
  timeToHire!: TimeToHireDto;

  @ApiProperty({ type: [TimeInStageDto] })
  timeInStage!: TimeInStageDto[];

  @ApiProperty({ type: [FunnelStageDto] })
  funnel!: FunnelStageDto[];

  @ApiProperty({ type: [SourceReportDto] })
  sources!: SourceReportDto[];

  @ApiProperty({ type: [WeeklyBucketDto] })
  applicationsOverTime!: WeeklyBucketDto[];

  @ApiProperty({ type: OfferReportDto })
  offers!: OfferReportDto;

  @ApiProperty({ type: InterviewReportDto })
  interviews!: InterviewReportDto;

  @ApiProperty({ type: [RecruiterReportDto] })
  recruiters!: RecruiterReportDto[];

  @ApiProperty({ type: [RejectionReasonDto] })
  rejectionReasons!: RejectionReasonDto[];

  @ApiProperty({ type: [ClientReportDto] })
  clients!: ClientReportDto[];
}
