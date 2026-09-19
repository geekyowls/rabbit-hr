import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ListPaginationDto } from '@modules/shared/dtos/list-pagination.dto';
import { OrganizationStatus, OrgSubscriptionStatus } from '@db/enums';

export class ListOrganizationsDto extends ListPaginationDto {
  @ApiPropertyOptional({ enum: OrganizationStatus })
  @IsEnum(OrganizationStatus)
  @IsOptional()
  status?: OrganizationStatus;

  @ApiPropertyOptional({ enum: OrgSubscriptionStatus })
  @IsEnum(OrgSubscriptionStatus)
  @IsOptional()
  subscriptionStatus?: OrgSubscriptionStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}
