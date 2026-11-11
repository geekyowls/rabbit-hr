import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Trim } from '@shared/transformers/trim';
import { EmploymentType, JobStatus, RateUnit, WorkMode } from '@db/enums';

export class ScreeningQuestionDto {
  @ApiPropertyOptional({ example: 'q1' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  id?: string;

  @ApiProperty({ example: 'Do you hold a full UK driving licence?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question!: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  required!: boolean;
}

export class CreateJobDto {
  @ApiProperty({ example: 'Senior Care Assistant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Trim()
  title!: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  requirements?: string | null;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: WorkMode })
  @IsEnum(WorkMode)
  @IsOptional()
  workMode?: WorkMode;

  @ApiPropertyOptional({ example: 'Leeds' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string | null;

  @ApiPropertyOptional({ example: 28000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMin?: number | null;

  @ApiPropertyOptional({ example: 32000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMax?: number | null;

  @ApiPropertyOptional({ example: 13.5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  payRate?: number | null;

  @ApiPropertyOptional({ example: 18.25 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  chargeRate?: number | null;

  @ApiPropertyOptional({ enum: RateUnit })
  @IsEnum(RateUnit)
  @IsOptional()
  rateUnit?: RateUnit | null;

  @ApiPropertyOptional({ example: 'GBP', default: 'GBP' })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  openings?: number;

  @ApiPropertyOptional({ enum: JobStatus, default: JobStatus.DRAFT })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  closingDate?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ type: [ScreeningQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScreeningQuestionDto)
  @IsOptional()
  screeningQuestions?: ScreeningQuestionDto[];

  @ApiPropertyOptional({ type: [String], example: ['cv', 'right_to_work'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredDocuments?: string[];
}
