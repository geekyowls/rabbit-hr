import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { BaseAuthenticatedCommand } from '@boilerplate/core';

export class UpdatePagePreferencesCommand extends BaseAuthenticatedCommand {
  @IsString()
  @IsNotEmpty()
  readonly page: string;

  @IsOptional()
  @IsArray()
  @Type(() => Object)
  readonly savedViews?: Array<{
    name: string;
    filters: Record<string, string>;
  }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly columns?: string[];
}
