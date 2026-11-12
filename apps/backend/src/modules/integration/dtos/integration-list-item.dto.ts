import { PlanFeature } from '@boilerplate/core';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IntegrationListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  iconUrl?: string | null;

  @ApiProperty()
  category: string;

  @ApiProperty()
  authType: string;

  @ApiProperty()
  isConnected: boolean;

  @ApiProperty()
  isConfigured: boolean;

  @ApiPropertyOptional()
  accountEmail?: string | null;

  @ApiPropertyOptional()
  accountName?: string | null;

  @ApiPropertyOptional()
  connectedAt?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  errorMessage?: string | null;

  @ApiPropertyOptional()
  webhookToken?: string | null;

  @ApiPropertyOptional({ enum: PlanFeature, nullable: true })
  planFeature: PlanFeature | null;
}
