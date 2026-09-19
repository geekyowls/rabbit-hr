import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ description: 'User last name', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;
}
