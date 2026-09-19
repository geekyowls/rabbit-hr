import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class UpdatePagePreferencesDto {
  @ApiProperty({ example: 'clients' })
  @IsString()
  @IsNotEmpty()
  page!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @Type(() => Object)
  savedViews?: Array<{ name: string; filters: Record<string, string> }>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];
}
