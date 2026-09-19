import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim } from '@modules/shared/transformers/trim';

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Trim()
  name!: string;

  @ApiProperty({ description: 'Admin user email' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @Trim()
  adminEmail!: string;

  @ApiProperty({ description: 'Admin user first name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Trim()
  adminFirstName!: string;

  @ApiPropertyOptional({ description: 'Admin user last name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Trim()
  adminLastName?: string;

  @ApiProperty({ description: 'Admin user password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  adminPassword!: string;

  @ApiPropertyOptional({ description: 'Organization logo path or URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string | null;
}
