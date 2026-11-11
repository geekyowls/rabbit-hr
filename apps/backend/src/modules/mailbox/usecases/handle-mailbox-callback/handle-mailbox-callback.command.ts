import { IsNotEmpty, IsString } from 'class-validator';
import { BaseCommand } from '@boilerplate/core';

export class HandleMailboxCallbackCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @IsString()
  @IsNotEmpty()
  readonly state: string;
}
