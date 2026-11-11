import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';
import { ApplicationStage, CandidateSource, RightToWork } from '@db/enums';

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

  @IsEnum(ApplicationStage)
  @IsOptional()
  stage?: ApplicationStage;

  @IsEnum(RightToWork)
  @IsOptional()
  rightToWork?: RightToWork;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
