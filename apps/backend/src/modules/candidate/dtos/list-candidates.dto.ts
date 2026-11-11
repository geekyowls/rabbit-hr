import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { ApplicationStage, CandidateSource, RightToWork } from '@db/enums';

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

  @ApiPropertyOptional({ enum: ApplicationStage })
  @IsEnum(ApplicationStage)
  @IsOptional()
  stage?: ApplicationStage;

  @ApiPropertyOptional({ enum: RightToWork })
  @IsEnum(RightToWork)
  @IsOptional()
  rightToWork?: RightToWork;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
