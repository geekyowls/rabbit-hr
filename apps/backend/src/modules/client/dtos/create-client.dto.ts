import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Trim } from '@shared/transformers/trim';
import { ClientStatus } from '@db/enums';
import { ClientAddressDto, ClientBillingDto } from './client-address.dto';

export class CreateClientDto {
  @ApiProperty({ example: 'Northern Care Group' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Trim()
  name!: string;

  @ApiPropertyOptional({ example: 'Northern Care Group Ltd' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  legalName?: string | null;

  @ApiPropertyOptional({ example: 'Healthcare' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  industry?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  website?: string | null;

  @ApiPropertyOptional({ example: '+44 161 496 0000' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'hello@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string | null;

  @ApiPropertyOptional({ type: ClientAddressDto })
  @ValidateNested()
  @Type(() => ClientAddressDto)
  @IsOptional()
  address?: ClientAddressDto | null;

  @ApiPropertyOptional({ type: ClientBillingDto })
  @ValidateNested()
  @Type(() => ClientBillingDto)
  @IsOptional()
  billing?: ClientBillingDto | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: '#3F6650' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  brandColor?: string | null;

  @ApiPropertyOptional({ enum: ClientStatus, default: ClientStatus.ACTIVE })
  @IsEnum(ClientStatus)
  @IsOptional()
  status?: ClientStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string | null;
}
