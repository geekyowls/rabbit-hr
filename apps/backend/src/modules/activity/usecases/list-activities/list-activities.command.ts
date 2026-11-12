import { IsOptional, IsUUID } from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';

export class ListActivitiesCommand extends BasePaginatedCommand {
  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @IsUUID()
  @IsOptional()
  jobId?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;
}
