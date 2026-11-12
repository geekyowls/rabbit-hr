import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientStatus } from '@db/enums';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';
import { ClientAddressDto, ClientBillingDto } from './client-address.dto';

export class ClientContactResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  clientId!: string;

  @ApiProperty()
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  jobTitle!: string | null;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ClientResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  legalName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  industry!: string | null;

  @ApiPropertyOptional({ nullable: true })
  website!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ type: ClientAddressDto, nullable: true })
  address!: ClientAddressDto | null;

  @ApiPropertyOptional({ type: ClientBillingDto, nullable: true })
  billing!: ClientBillingDto | null;

  @ApiPropertyOptional({ nullable: true })
  logoUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  brandColor!: string | null;

  @ApiProperty({ enum: ClientStatus })
  status!: ClientStatus;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ownerId!: string | null;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  owner!: UserSummaryDto | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ClientListItemDto extends ClientResponseDto {
  @ApiProperty()
  contactCount!: number;

  @ApiProperty()
  jobCount!: number;

  @ApiProperty()
  openJobCount!: number;

  @ApiProperty()
  applicationCount!: number;
}

export class ClientDetailDto extends ClientListItemDto {
  @ApiProperty({ type: [ClientContactResponseDto] })
  contacts!: ClientContactResponseDto[];

  @ApiProperty()
  placementCount!: number;
}
