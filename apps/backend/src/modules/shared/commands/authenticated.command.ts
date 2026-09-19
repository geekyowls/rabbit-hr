import { BaseCommand } from '@boilerplate/core';
import { IsNotEmpty } from 'class-validator';

export abstract class AuthenticatedCommand extends BaseCommand {
  @IsNotEmpty()
  public readonly userId: string;
}
