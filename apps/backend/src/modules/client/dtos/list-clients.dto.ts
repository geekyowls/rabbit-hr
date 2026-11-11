import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { ClientStatus } from '@db/enums';

export class ListClientsDto extends ListPaginationDto {
  @ApiPropertyOptional({ example: 'care' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ClientStatus })
  @IsEnum(ClientStatus)
  @IsOptional()
  status?: ClientStatus;
}
