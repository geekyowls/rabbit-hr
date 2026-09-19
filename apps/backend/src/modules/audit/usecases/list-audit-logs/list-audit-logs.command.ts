import { IsDate, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';

export class ListAuditLogsCommand extends BasePaginatedCommand {
  @IsUUID()
  @IsOptional()
  actorId?: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsIn(['POST', 'PUT', 'PATCH', 'DELETE'])
  @IsOptional()
  method?: string;

  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;
}
