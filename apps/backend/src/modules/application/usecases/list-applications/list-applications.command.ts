import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';
import { PipelineStageCategory } from '@db/enums';
import { STAGE_KEY_PATTERN } from '@modules/pipeline-stage/dtos/pipeline-stage.dto';

export class ListApplicationsCommand extends BasePaginatedCommand {
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @IsString()
  @Matches(STAGE_KEY_PATTERN)
  @IsOptional()
  stage?: string;

  @IsEnum(PipelineStageCategory)
  @IsOptional()
  stageCategory?: PipelineStageCategory;

  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  shortlisted?: boolean;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
