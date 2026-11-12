import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateJobFeedSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeClientNames?: boolean;

  @ApiPropertyOptional({
    description: 'Issue a new feed URL; the old one stops working',
  })
  @IsOptional()
  @IsBoolean()
  regenerateToken?: boolean;
}
