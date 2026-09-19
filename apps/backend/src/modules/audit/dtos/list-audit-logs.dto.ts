import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';

export class ListAuditLogsDto extends ListPaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by actor ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  actorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by action name',
    example: 'users.invite',
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter by HTTP method',
    example: 'POST',
    enum: ['POST', 'PUT', 'PATCH', 'DELETE'],
  })
  @IsIn(['POST', 'PUT', 'PATCH', 'DELETE'])
  @IsOptional()
  method?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter by end date',
    example: '2024-12-31T23:59:59.999Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;
}
