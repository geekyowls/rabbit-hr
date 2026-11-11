import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';
import { ApplicationStage } from '@db/enums';

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

  @IsEnum(ApplicationStage)
  @IsOptional()
  stage?: ApplicationStage;

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
