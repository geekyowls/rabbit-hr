import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Trim } from '@shared/transformers/trim';

export class CreateClientContactDto {
  @ApiProperty({ example: 'Sarah' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Trim()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Thompson' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string | null;

  @ApiPropertyOptional({ example: 'sarah@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string | null;

  @ApiPropertyOptional({ example: '+44 7700 900123' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'HR Manager' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  jobTitle?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateClientContactDto extends PartialType(
  CreateClientContactDto,
) {}
