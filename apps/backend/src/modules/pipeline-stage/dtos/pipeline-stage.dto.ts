import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Trim } from '@shared/transformers/trim';
import { PipelineStageCategory } from '@db/enums';

export const STAGE_KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
export const MAX_PIPELINE_STAGES = 30;

export class PipelineStageInputDto {
  @ApiPropertyOptional({
    example: 'phone_screen',
    description: 'Slug, generated from the name when omitted',
  })
  @IsString()
  @Matches(STAGE_KEY_PATTERN, {
    message: 'key must be a lowercase slug (a-z, 0-9, _)',
  })
  @IsOptional()
  key?: string;

  @ApiProperty({ example: 'Phone screen' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Trim()
  name!: string;

  @ApiProperty({ enum: PipelineStageCategory })
  @IsEnum(PipelineStageCategory)
  category!: PipelineStageCategory;

  @ApiPropertyOptional({ example: 'blue' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class PipelineStageMoveDto {
  @ApiProperty({ example: 'phone_screen' })
  @IsString()
  @Matches(STAGE_KEY_PATTERN)
  fromKey!: string;

  @ApiProperty({ example: 'screening' })
  @IsString()
  @Matches(STAGE_KEY_PATTERN)
  toKey!: string;
}

export class ReplacePipelineStagesDto {
  @ApiProperty({ type: [PipelineStageInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PIPELINE_STAGES)
  @ValidateNested({ each: true })
  @Type(() => PipelineStageInputDto)
  stages!: PipelineStageInputDto[];

  @ApiPropertyOptional({
    type: [PipelineStageMoveDto],
    description:
      'Where to move applications of stages that are removed or deactivated',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PipelineStageMoveDto)
  @IsOptional()
  moves?: PipelineStageMoveDto[];
}

export class PipelineStageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'screening' })
  key!: string;

  @ApiProperty({ example: 'Screening' })
  name!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty({ enum: PipelineStageCategory })
  category!: PipelineStageCategory;

  @ApiProperty({ example: 'blue' })
  color!: string;

  @ApiProperty()
  isSystem!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  applicationCount!: number;
}
