import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';
import { InterviewStatus } from '@db/enums';

export class ListInterviewsCommand extends BasePaginatedCommand {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsEnum(InterviewStatus)
  @IsOptional()
  status?: InterviewStatus;

  @IsUUID()
  @IsOptional()
  jobId?: string;

  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @IsUUID()
  @IsOptional()
  interviewerId?: string;

  @IsBoolean()
  @IsOptional()
  mine?: boolean;

  @IsBoolean()
  @IsOptional()
  needsFeedback?: boolean;
}
