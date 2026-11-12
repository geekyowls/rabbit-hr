import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { EmploymentType, JobStatus } from '@db/enums';

export class ListJobsDto extends ListPaginationDto {
  @ApiPropertyOptional({ example: 'care' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  hiringManagerId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  recruiterId?: string;
}
