import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SaveCredentialsDto {
  @ApiPropertyOptional({ description: 'API key for OpenAI or Gemini' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Auth ID for Plivo' })
  @IsOptional()
  @IsString()
  authId?: string;

  @ApiPropertyOptional({ description: 'Auth token for Plivo' })
  @IsOptional()
  @IsString()
  authToken?: string;

  @ApiPropertyOptional({ description: 'Plivo phone number (caller ID)' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Razorpay webhook signing secret' })
  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
