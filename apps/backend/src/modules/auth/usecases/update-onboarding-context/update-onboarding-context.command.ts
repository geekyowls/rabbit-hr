import { BaseAuthenticatedCommand } from '@boilerplate/core';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateOnboardingContextCommand extends BaseAuthenticatedCommand {
  @IsString()
  @IsNotEmpty()
  @IsIn(['solo', 'team'])
  practiceType!: 'solo' | 'team';

  @ValidateIf((o: UpdateOnboardingContextCommand) => o.practiceType === 'team')
  @IsString()
  @IsNotEmpty()
  @IsIn(['2-5', '6-10', '11-25', '25+'])
  teamSize?: '2-5' | '6-10' | '11-25' | '25+';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsString()
  phoneCountryCode?: string;
}
