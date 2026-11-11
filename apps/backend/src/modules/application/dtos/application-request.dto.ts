import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  Matches,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { TransformToBoolean } from '@shared/transformers/to-boolean';
import { CandidateSource, PipelineStageCategory } from '@db/enums';
import { STAGE_KEY_PATTERN } from '@modules/pipeline-stage/dtos/pipeline-stage.dto';

export class ListApplicationsDto extends ListPaginationDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @ApiPropertyOptional({ example: 'screening', description: 'Stage key' })
  @IsString()
  @Matches(STAGE_KEY_PATTERN)
  @IsOptional()
  stage?: string;

  @ApiPropertyOptional({ enum: PipelineStageCategory })
  @IsEnum(PipelineStageCategory)
  @IsOptional()
  stageCategory?: PipelineStageCategory;

  @ApiPropertyOptional({ description: 'Candidate name, email or job title' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @TransformToBoolean()
  @IsOptional()
  shortlisted?: boolean;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string;
}

export class ApplicationBoardDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  limitPerStage?: number;
}

export class CreateApplicationDto {
  @ApiProperty()
  @IsUUID()
  candidateId!: string;

  @ApiProperty()
  @IsUUID()
  jobId!: string;

  @ApiPropertyOptional({
    example: 'applied',
    description: 'Stage key, defaults to the first applied stage',
  })
  @IsString()
  @Matches(STAGE_KEY_PATTERN)
  @IsOptional()
  stage?: string;

  @ApiPropertyOptional({ enum: CandidateSource })
  @IsEnum(CandidateSource)
  @IsOptional()
  source?: CandidateSource;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string;
}

export class UpdateApplicationStageDto {
  @ApiProperty({ example: 'interview', description: 'Stage key' })
  @IsString()
  @Matches(STAGE_KEY_PATTERN)
  stage!: string;

  @ApiPropertyOptional({
    description: 'Required when the target stage is in the rejected category',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @IsOptional()
  rejectionReason?: string;
}

export class UpdateApplicationDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 5, nullable: true })
  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number | null;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  shortlisted?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsUUID()
  @IsOptional()
  ownerId?: string | null;
}
