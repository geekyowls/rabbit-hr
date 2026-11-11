import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';
import { EmploymentType, JobStatus } from '@db/enums';

export class ListJobsCommand extends BasePaginatedCommand {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsUUID()
  @IsOptional()
  hiringManagerId?: string;

  @IsUUID()
  @IsOptional()
  recruiterId?: string;
}
