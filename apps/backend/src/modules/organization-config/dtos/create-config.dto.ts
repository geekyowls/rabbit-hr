import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Trim } from '@shared/transformers/trim';
import { OrganizationConfigType } from '@db/enums';

export class CreateConfigDto {
  @ApiProperty({
    enum: OrganizationConfigType,
    example: OrganizationConfigType.CLIENT_TAG,
  })
  @IsEnum(OrganizationConfigType)
  @IsNotEmpty()
  type!: OrganizationConfigType;

  @ApiProperty({ example: 'VIP' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Trim()
  name!: string;

  @ApiPropertyOptional({ type: Object, example: { color: '#ff0000' } })
  @IsObject()
  @IsOptional()
  value?: Record<string, unknown>;
}
