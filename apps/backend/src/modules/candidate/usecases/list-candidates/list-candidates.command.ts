import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';
import { CandidateSource, PipelineStageCategory, RightToWork } from '@db/enums';
import { STAGE_KEY_PATTERN } from '@modules/pipeline-stage/dtos/pipeline-stage.dto';

export class ListCandidatesCommand extends BasePaginatedCommand {
  @IsString()
  @IsOptional()
  search?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(CandidateSource)
  @IsOptional()
  source?: CandidateSource;

  @IsUUID()
  @IsOptional()
  jobId?: string;

  @IsString()
  @Matches(STAGE_KEY_PATTERN)
  @IsOptional()
  stage?: string;

  @IsEnum(PipelineStageCategory)
  @IsOptional()
  stageCategory?: PipelineStageCategory;

  @IsEnum(RightToWork)
  @IsOptional()
  rightToWork?: RightToWork;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
