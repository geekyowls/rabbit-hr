import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsISO31661Alpha2,
  IsISO4217CurrencyCode,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AtsDateFormat, SalaryPeriod } from '@db/enums';

export const MAX_DEPARTMENTS = 100;

export class UpdateAtsSettingsDto {
  @ApiPropertyOptional({ example: 'USD' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsISO4217CurrencyCode()
  @IsOptional()
  defaultCurrency?: string;

  @ApiPropertyOptional({ example: 'US' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsISO31661Alpha2()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ enum: AtsDateFormat })
  @IsEnum(AtsDateFormat)
  @IsOptional()
  dateFormat?: AtsDateFormat;

  @ApiPropertyOptional({ example: 'en-US' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(35)
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional({ enum: [0, 1] })
  @IsIn([0, 1])
  @IsOptional()
  weekStartsOn?: 0 | 1;

  @ApiPropertyOptional({ enum: SalaryPeriod })
  @IsEnum(SalaryPeriod)
  @IsOptional()
  salaryPeriodDefault?: SalaryPeriod;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayMaxSize(MAX_DEPARTMENTS)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  @IsOptional()
  departments?: string[];
}

export class AtsSettingsResponseDto {
  @ApiProperty({ example: 'USD' })
  defaultCurrency!: string;

  @ApiProperty({ example: 'US' })
  country!: string;

  @ApiProperty({ example: 'UTC' })
  timezone!: string;

  @ApiProperty({ enum: AtsDateFormat })
  dateFormat!: AtsDateFormat;

  @ApiProperty({ example: 'en-US' })
  locale!: string;

  @ApiProperty({ enum: [0, 1] })
  weekStartsOn!: 0 | 1;

  @ApiProperty({ enum: SalaryPeriod })
  salaryPeriodDefault!: SalaryPeriod;

  @ApiProperty({ type: [String] })
  departments!: string[];
}
