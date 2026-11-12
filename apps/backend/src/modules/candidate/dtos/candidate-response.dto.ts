import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CandidateSource, RightToWork } from '@db/enums';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';

export class CandidateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

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
  currentTitle!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currentEmployer!: string | null;

  @ApiPropertyOptional({ nullable: true })
  yearsExperience!: number | null;

  @ApiProperty({ type: [String] })
  skills!: string[];

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ enum: CandidateSource })
  source!: CandidateSource;

  @ApiPropertyOptional({ nullable: true })
  cvFileKey!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cvFileName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkedinUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  expectedSalary!: number | null;

  @ApiPropertyOptional({ nullable: true })
  noticePeriod!: string | null;

  @ApiProperty({ enum: RightToWork })
  rightToWork!: RightToWork;

  @ApiPropertyOptional({ nullable: true })
  gdprConsentAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  ownerId!: string | null;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  owner!: UserSummaryDto | null;

  @ApiPropertyOptional({ nullable: true })
  rating!: number | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { preferred_work_mode: 'Hybrid' },
  })
  customFields!: Record<string, unknown>;

  @ApiPropertyOptional({ nullable: true })
  portalInvitedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  portalLastLoginAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CandidateLatestApplicationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  jobId!: string;

  @ApiProperty()
  jobTitle!: string;

  @ApiProperty({ example: 'screening', description: 'Stage key' })
  stage!: string;

  @ApiProperty()
  stageChangedAt!: Date;
}

export class CandidateListItemDto extends CandidateResponseDto {
  @ApiProperty()
  applicationCount!: number;

  @ApiPropertyOptional({ type: CandidateLatestApplicationDto, nullable: true })
  latestApplication!: CandidateLatestApplicationDto | null;
}

export class CandidateApplicationSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  jobId!: string;

  @ApiProperty()
  jobTitle!: string;

  @ApiProperty()
  jobReference!: string;

  @ApiPropertyOptional({ nullable: true })
  clientId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  clientName!: string | null;

  @ApiProperty({ example: 'screening', description: 'Stage key' })
  stage!: string;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  rating!: number | null;

  @ApiProperty()
  shortlisted!: boolean;

  @ApiProperty()
  appliedAt!: Date;

  @ApiProperty()
  stageChangedAt!: Date;
}

export class CandidateDetailDto extends CandidateResponseDto {
  @ApiProperty({ type: [CandidateApplicationSummaryDto] })
  applications!: CandidateApplicationSummaryDto[];
}
