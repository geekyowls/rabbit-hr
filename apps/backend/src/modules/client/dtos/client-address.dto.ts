import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class ClientAddressDto {
  @ApiPropertyOptional({ example: '12 King Street' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional({ example: 'Manchester' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Greater Manchester' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  county?: string;

  @ApiPropertyOptional({ example: 'M2 4WU' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postcode?: string;

  @ApiPropertyOptional({ example: 'United Kingdom', default: 'United Kingdom' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;
}

export class ClientBillingDto {
  @ApiPropertyOptional({ example: 'Accounts Payable' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  contactName?: string;

  @ApiPropertyOptional({ example: 'accounts@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+44 161 496 0000' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: '30 days' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  paymentTerms?: string;

  @ApiPropertyOptional({
    example: 'USD',
    description: 'Defaults to the organization default currency',
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;
}
