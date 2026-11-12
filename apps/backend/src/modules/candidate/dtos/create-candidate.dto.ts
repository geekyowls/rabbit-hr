import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '@shared/transformers/trim';
import { CandidateSource, RightToWork } from '@db/enums';

export class CreateCandidateDto {
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
  phone?: string | null;

  @ApiPropertyOptional({ example: 'Manchester' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string | null;

  @ApiPropertyOptional({ example: 'Experienced senior carer' })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  headline?: string | null;

  @ApiPropertyOptional({ example: 'Senior Care Assistant' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  currentTitle?: string | null;

  @ApiPropertyOptional({ example: 'Bupa' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  currentEmployer?: string | null;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(70)
  yearsExperience?: number | null;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ enum: CandidateSource })
  @IsEnum(CandidateSource)
  @IsOptional()
  source?: CandidateSource;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  cvFileKey?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  cvFileName?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(300)
  linkedinUrl?: string | null;

  @ApiPropertyOptional({ example: 32000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  expectedSalary?: number | null;

  @ApiPropertyOptional({ example: '1 month' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  noticePeriod?: string | null;

  @ApiPropertyOptional({ enum: RightToWork })
  @IsEnum(RightToWork)
  @IsOptional()
  rightToWork?: RightToWork;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  gdprConsentAt?: string | null;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(5)
  rating?: number | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Values keyed by custom field key',
  })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, unknown>;
}
