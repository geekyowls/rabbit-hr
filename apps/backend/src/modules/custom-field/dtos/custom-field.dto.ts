import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { Trim } from '@shared/transformers/trim';
import { TransformToBoolean } from '@shared/transformers/to-boolean';
import { CustomFieldEntityType, CustomFieldType } from '@db/enums';

export const CUSTOM_FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
export const MAX_CUSTOM_FIELD_OPTIONS = 100;

export class ListCustomFieldsQueryDto {
  @ApiPropertyOptional({ enum: CustomFieldEntityType })
  @IsEnum(CustomFieldEntityType)
  @IsOptional()
  entity?: CustomFieldEntityType;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @TransformToBoolean()
  @IsOptional()
  activeOnly?: boolean;
}

class CustomFieldSettingsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayMaxSize(MAX_CUSTOM_FIELD_OPTIONS)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Candidate fields only' })
  @IsBoolean()
  @IsOptional()
  showOnCareersForm?: boolean;
}

export class UpdateCustomFieldDto extends CustomFieldSettingsDto {
  @ApiPropertyOptional({ example: 'Preferred work mode' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Trim()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ enum: CustomFieldType })
  @IsEnum(CustomFieldType)
  @IsOptional()
  type?: CustomFieldType;
}

export class CreateCustomFieldDto extends CustomFieldSettingsDto {
  @ApiProperty({ enum: CustomFieldEntityType })
  @IsEnum(CustomFieldEntityType)
  entity!: CustomFieldEntityType;

  @ApiPropertyOptional({
    example: 'preferred_work_mode',
    description: 'Slug, generated from the label when omitted',
  })
  @IsString()
  @Matches(CUSTOM_FIELD_KEY_PATTERN, {
    message: 'key must be a lowercase slug (a-z, 0-9, _)',
  })
  @IsOptional()
  key?: string;

  @ApiProperty({ example: 'Preferred work mode' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Trim()
  label!: string;

  @ApiProperty({ enum: CustomFieldType })
  @IsEnum(CustomFieldType)
  type!: CustomFieldType;
}

export class ReorderCustomFieldsDto {
  @ApiProperty({ enum: CustomFieldEntityType })
  @IsEnum(CustomFieldEntityType)
  entity!: CustomFieldEntityType;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids!: string[];
}

export class CustomFieldResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: CustomFieldEntityType })
  entity!: CustomFieldEntityType;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ enum: CustomFieldType })
  type!: CustomFieldType;

  @ApiProperty({ type: [String] })
  options!: string[];

  @ApiProperty()
  required!: boolean;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  showOnCareersForm!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DeleteCustomFieldResponseDto {
  @ApiProperty()
  deleted!: boolean;

  @ApiProperty({
    description:
      'True when values existed and the field was deactivated instead',
  })
  deactivated!: boolean;
}
