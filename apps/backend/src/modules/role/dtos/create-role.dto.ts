import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '@shared/transformers/trim';

export class CreateRoleDto {
  @ApiProperty({ example: 'Editor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Trim()
  name!: string;

  @ApiProperty({ type: [String], example: ['user:read', 'user:list:read'] })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}
