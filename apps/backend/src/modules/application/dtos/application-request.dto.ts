import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { TransformToBoolean } from '@shared/transformers/to-boolean';
import { ApplicationStage, CandidateSource } from '@db/enums';

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

  @ApiPropertyOptional({ enum: ApplicationStage })
  @IsEnum(ApplicationStage)
  @IsOptional()
  stage?: ApplicationStage;

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

  @ApiPropertyOptional({ enum: ApplicationStage })
  @IsEnum(ApplicationStage)
  @IsOptional()
  stage?: ApplicationStage;

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
  @ApiProperty({ enum: ApplicationStage })
  @IsEnum(ApplicationStage)
  stage!: ApplicationStage;

  @ApiPropertyOptional({ description: 'Required when stage is rejected' })
  @ValidateIf(
    (o: UpdateApplicationStageDto) => o.stage === ApplicationStage.REJECTED,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
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
