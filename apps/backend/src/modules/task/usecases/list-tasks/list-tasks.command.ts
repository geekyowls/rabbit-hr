import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';
import { TaskDueFilter, TaskStatus } from '@db/enums';

export class ListTasksCommand extends BasePaginatedCommand {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsBoolean()
  @IsOptional()
  mine?: boolean;

  @IsEnum(TaskDueFilter)
  @IsOptional()
  due?: TaskDueFilter;

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
