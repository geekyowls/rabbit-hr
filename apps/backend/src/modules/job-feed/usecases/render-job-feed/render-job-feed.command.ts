import { IsIn, IsString, MaxLength } from 'class-validator';
import { BaseCommand } from '@boilerplate/core';
import type { JobFeedFormat } from '../../job-feed.helpers';

export class RenderJobFeedCommand extends BaseCommand {
  @IsString()
  @MaxLength(128)
  readonly token: string;

  @IsIn(['indeed', 'linkedin'])
  readonly format: JobFeedFormat;
}
