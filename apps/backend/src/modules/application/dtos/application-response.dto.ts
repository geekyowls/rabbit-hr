import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CandidateSource, PipelineStageCategory, RightToWork } from '@db/enums';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';

export class ApplicationAnswerDto {
  @ApiProperty()
  questionId!: string;

  @ApiPropertyOptional()
  question?: string;

  @ApiProperty()
  answer!: string;
}

export class ApplicationCandidateSummaryDto {
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
  currentTitle!: string | null;

  @ApiProperty({ type: [String] })
  skills!: string[];

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ enum: RightToWork })
  rightToWork!: RightToWork;
}

export class ApplicationJobSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reference!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  clientId!: string | null;

  @ApiPropertyOptional({
    type: () => ApplicationClientSummaryDto,
    nullable: true,
  })
  client!: ApplicationClientSummaryDto | null;
}

export class ApplicationClientSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class ApplicationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  candidateId!: string;

  @ApiProperty()
  jobId!: string;

  @ApiProperty({ example: 'screening', description: 'Stage key' })
  stage!: string;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  rating!: number | null;

  @ApiProperty()
  shortlisted!: boolean;

  @ApiProperty({ enum: CandidateSource })
  source!: CandidateSource;

  @ApiPropertyOptional({ type: [ApplicationAnswerDto], nullable: true })
  answers!: ApplicationAnswerDto[] | null;

  @ApiProperty()
  stageChangedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  ownerId!: string | null;

  @ApiProperty()
  appliedAt!: Date;

  @ApiProperty({ type: ApplicationCandidateSummaryDto })
  candidate!: ApplicationCandidateSummaryDto;

  @ApiProperty({ type: ApplicationJobSummaryDto })
  job!: ApplicationJobSummaryDto;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  owner!: UserSummaryDto | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class BoardCardDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  candidateId!: string;

  @ApiProperty()
  candidateName!: string;

  @ApiPropertyOptional({ nullable: true })
  candidateHeadline!: string | null;

  @ApiPropertyOptional({ nullable: true })
  candidateLocation!: string | null;

  @ApiProperty({ type: [String] })
  candidateTags!: string[];

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
  rating!: number | null;

  @ApiProperty()
  shortlisted!: boolean;

  @ApiProperty({ enum: CandidateSource })
  source!: CandidateSource;

  @ApiPropertyOptional({ nullable: true })
  ownerId!: string | null;

  @ApiProperty()
  appliedAt!: Date;

  @ApiProperty()
  stageChangedAt!: Date;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Start of the next scheduled interview, if any',
  })
  nextInterviewAt!: Date | null;
}

export class BoardColumnDto {
  @ApiProperty({ example: 'screening', description: 'Stage key' })
  stage!: string;

  @ApiProperty({ example: 'Screening' })
  name!: string;

  @ApiProperty({ enum: PipelineStageCategory })
  category!: PipelineStageCategory;

  @ApiProperty({ example: 'blue' })
  color!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  count!: number;

  @ApiProperty({ type: [BoardCardDto] })
  cards!: BoardCardDto[];
}

export class ApplicationBoardResponseDto {
  @ApiProperty({ type: [BoardColumnDto] })
  stages!: BoardColumnDto[];
}
