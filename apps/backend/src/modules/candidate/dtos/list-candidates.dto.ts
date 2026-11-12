import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { CandidateSource, PipelineStageCategory, RightToWork } from '@db/enums';
import { STAGE_KEY_PATTERN } from '@modules/pipeline-stage/dtos/pipeline-stage.dto';

export class ListCandidatesDto extends ListPaginationDto {
  @ApiPropertyOptional({ description: 'Name, email, title or skill' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ enum: CandidateSource })
  @IsEnum(CandidateSource)
  @IsOptional()
  source?: CandidateSource;

  @ApiPropertyOptional({
    description: 'Candidates with an application to this job',
  })
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional({ example: 'screening', description: 'Stage key' })
  @IsString()
  @Matches(STAGE_KEY_PATTERN)
  @IsOptional()
  stage?: string;

  @ApiPropertyOptional({ enum: PipelineStageCategory })
  @IsEnum(PipelineStageCategory)
  @IsOptional()
  stageCategory?: PipelineStageCategory;

  @ApiPropertyOptional({ enum: RightToWork })
  @IsEnum(RightToWork)
  @IsOptional()
  rightToWork?: RightToWork;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
