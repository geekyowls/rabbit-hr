import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '@shared/transformers/trim';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Editor' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Trim()
  name?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['user:read', 'user:list:read'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
