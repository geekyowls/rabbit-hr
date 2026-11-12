import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { BaseCommand } from '@boilerplate/core';

export class GetPortalBrandingCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly orgSlug: string;
}
