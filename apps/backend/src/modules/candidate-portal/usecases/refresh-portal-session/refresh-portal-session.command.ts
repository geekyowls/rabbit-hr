import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseCommand } from '@boilerplate/core';

export class RefreshPortalSessionCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  readonly refreshToken: string;

  @IsString()
  @IsOptional()
  readonly userAgent?: string;

  @IsString()
  @IsOptional()
  readonly ipAddress?: string;
}
