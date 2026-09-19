import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListPaginationDto {
  @ApiPropertyOptional({
    type: Number,
    required: false,
    default: 1,
    description: 'Page number (1-indexed)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    type: Number,
    required: false,
    default: 10,
    maximum: 100,
    description: 'Number of items per page',
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 10;
}
