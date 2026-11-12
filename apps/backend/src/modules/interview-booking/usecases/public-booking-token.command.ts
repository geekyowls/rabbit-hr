import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { BaseCommand } from '@boilerplate/core';

export class PublicBookingTokenCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  readonly token: string;
}
