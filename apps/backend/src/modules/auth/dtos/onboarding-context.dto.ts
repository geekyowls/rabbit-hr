import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateOnboardingContextBodyDto {
  @ApiProperty({ enum: ['solo', 'team'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['solo', 'team'])
  practiceType!: 'solo' | 'team';

  @ApiProperty({ enum: ['2-5', '6-10', '11-25', '25+'], required: false })
  @ValidateIf((o: UpdateOnboardingContextBodyDto) => o.practiceType === 'team')
  @IsString()
  @IsNotEmpty()
  @IsIn(['2-5', '6-10', '11-25', '25+'])
  teamSize?: '2-5' | '6-10' | '11-25' | '25+';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneCountryCode?: string;
}
