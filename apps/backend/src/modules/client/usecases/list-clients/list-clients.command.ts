import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';
import { ClientStatus } from '@db/enums';

export class ListClientsCommand extends BasePaginatedCommand {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(ClientStatus)
  @IsOptional()
  status?: ClientStatus;
}
