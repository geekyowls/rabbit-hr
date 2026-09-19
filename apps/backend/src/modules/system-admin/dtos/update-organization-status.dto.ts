import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { OrganizationStatus } from '@db/enums';

export class UpdateOrganizationStatusDto {
  @ApiProperty({
    enum: OrganizationStatus,
    description: 'New organization status',
  })
  @IsEnum(OrganizationStatus)
  @IsNotEmpty()
  status!: OrganizationStatus;
}
