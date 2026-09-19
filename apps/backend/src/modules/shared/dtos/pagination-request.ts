import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export function PaginationRequestDto(defaultLimit = 10, maxLimit = 100) {
  class PaginationRequest {
    @ApiPropertyOptional({
      type: Number,
      required: false,
      default: 1,
      description: 'Page number (1-indexed, first page is 1)',
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @ApiPropertyOptional({
      type: Number,
      required: false,
      default: defaultLimit,
      maximum: maxLimit,
      description: 'Number of items per page',
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(maxLimit)
    limit = defaultLimit;
  }

  return PaginationRequest;
}
