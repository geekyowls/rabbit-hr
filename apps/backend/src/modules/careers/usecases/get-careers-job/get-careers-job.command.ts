import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { BaseCommand } from '@boilerplate/core';

export class GetCareersJobCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly orgSlug: string;

  @IsUUID()
  readonly jobId: string;
}
