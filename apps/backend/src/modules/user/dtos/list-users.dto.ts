import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { UserStatus } from '@db/enums';

import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';

export class ListUsersDto extends ListPaginationDto {
  @ApiProperty({ enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({ example: 'john', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  invitedBy?: string;
}
