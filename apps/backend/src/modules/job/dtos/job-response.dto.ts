import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ApplicationStage,
  EmploymentType,
  JobStatus,
  RateUnit,
  WorkMode,
} from '@db/enums';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';
import { ScreeningQuestionDto } from './create-job.dto';

export class JobClientSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  logoUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  brandColor!: string | null;
}

export class JobResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'JOB-0001' })
  reference!: string;

  @ApiPropertyOptional({ nullable: true })
  clientId!: string | null;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  requirements!: string | null;

  @ApiProperty({ enum: EmploymentType })
  employmentType!: EmploymentType;

  @ApiProperty({ enum: WorkMode })
  workMode!: WorkMode;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiPropertyOptional({ nullable: true })
  salaryMin!: number | null;

  @ApiPropertyOptional({ nullable: true })
  salaryMax!: number | null;

  @ApiPropertyOptional({ nullable: true })
  payRate!: number | null;

  @ApiPropertyOptional({ nullable: true })
  chargeRate!: number | null;

  @ApiPropertyOptional({ enum: RateUnit, nullable: true })
  rateUnit!: RateUnit | null;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  openings!: number;

  @ApiProperty({ enum: JobStatus })
  status!: JobStatus;

  @ApiPropertyOptional({ nullable: true })
  ownerId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  closingDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: [String] })
  skills!: string[];

  @ApiProperty({ type: [ScreeningQuestionDto] })
  screeningQuestions!: ScreeningQuestionDto[];

  @ApiProperty({ type: [String] })
  requiredDocuments!: string[];

  @ApiPropertyOptional({ type: JobClientSummaryDto, nullable: true })
  client!: JobClientSummaryDto | null;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  owner!: UserSummaryDto | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class JobListItemDto extends JobResponseDto {
  @ApiProperty()
  applicationCount!: number;

  @ApiProperty({
    example: Object.fromEntries(
      Object.values(ApplicationStage).map((stage) => [stage, 0]),
    ),
  })
  stageCounts!: Record<ApplicationStage, number>;
}
