import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Equals,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { Trim } from '@shared/transformers/trim';
import { CustomFieldType, EmploymentType, RateUnit, WorkMode } from '@db/enums';
import { ScreeningQuestionDto } from '@modules/job/dtos/create-job.dto';

export const CAREERS_CV_EXTENSIONS = ['pdf', 'doc', 'docx'] as const;
export const CAREERS_CV_MAX_BYTES = 10 * 1024 * 1024;

export class ListCareersJobsQueryDto extends ListPaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;
}

export class CareersAnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  questionId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  answer!: string;
}

export class ApplyToJobDto {
  @ApiProperty({ example: 'Amelia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Trim()
  firstName!: string;

  @ApiProperty({ example: 'Hughes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Trim()
  lastName!: string;

  @ApiProperty({ example: 'amelia.hughes@example.com' })
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiPropertyOptional({ example: '+44 7700 900123' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: 'Leeds' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(300)
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  coverNote?: string;

  @ApiPropertyOptional({ type: [CareersAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CareersAnswerDto)
  @IsOptional()
  answers?: CareersAnswerDto[];

  @ApiProperty({ description: 'Must be true' })
  @IsBoolean()
  @Equals(true, { message: 'You must consent to data processing to apply' })
  gdprConsent!: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  cvFileKey?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  cvFileName?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Values for candidate custom fields shown on the careers form',
  })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, unknown>;
}

export class CareersUploadUrlDto {
  @ApiProperty({ enum: CAREERS_CV_EXTENSIONS })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(CAREERS_CV_EXTENSIONS)
  extension!: (typeof CAREERS_CV_EXTENSIONS)[number];

  @ApiProperty({ maximum: CAREERS_CV_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(CAREERS_CV_MAX_BYTES)
  sizeBytes!: number;
}

export class CareersOrganizationDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  logo!: string | null;

  @ApiPropertyOptional({ nullable: true })
  website!: string | null;
}

export class CareersJobListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reference!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: EmploymentType })
  employmentType!: EmploymentType;

  @ApiProperty({ enum: WorkMode })
  workMode!: WorkMode;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiPropertyOptional({ nullable: true })
  salaryMin!: number | null;

  @ApiPropertyOptional({ nullable: true })
  salaryMax!: number | null;

  @ApiPropertyOptional({ nullable: true })
  payRate!: number | null;

  @ApiPropertyOptional({ enum: RateUnit, nullable: true })
  rateUnit!: RateUnit | null;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  closingDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: [String] })
  skills!: string[];
}

export class CareersCustomFieldDto {
  @ApiProperty({ example: 'preferred_work_mode' })
  key!: string;

  @ApiProperty({ example: 'Preferred work mode' })
  label!: string;

  @ApiProperty({ enum: CustomFieldType })
  type!: CustomFieldType;

  @ApiProperty({ type: [String] })
  options!: string[];

  @ApiProperty()
  required!: boolean;
}

export class CareersJobDetailDto extends CareersJobListItemDto {
  @ApiProperty({ type: [CareersCustomFieldDto] })
  customFields!: CareersCustomFieldDto[];

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  requirements!: string | null;

  @ApiProperty({ type: [ScreeningQuestionDto] })
  screeningQuestions!: ScreeningQuestionDto[];

  @ApiProperty({ type: [String] })
  requiredDocuments!: string[];
}

export class ApplyToJobResponseDto {
  @ApiProperty()
  applied!: boolean;

  @ApiProperty()
  jobTitle!: string;
}

export class CareersUploadUrlResponseDto {
  @ApiProperty()
  signedUrl!: string;

  @ApiProperty()
  path!: string;

  @ApiProperty()
  key!: string;
}
