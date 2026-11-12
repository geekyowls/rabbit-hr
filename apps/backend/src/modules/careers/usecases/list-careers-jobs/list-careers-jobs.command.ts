import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BaseCommand } from '@boilerplate/core';
import { EmploymentType } from '@db/enums';

export class ListCareersJobsCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly orgSlug: string;

  @IsInt()
  @Min(1)
  readonly page: number;

  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit: number;

  @IsString()
  @IsOptional()
  readonly search?: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  readonly employmentType?: EmploymentType;

  @IsString()
  @IsOptional()
  readonly location?: string;
}
