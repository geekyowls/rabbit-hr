import { IsNotEmpty, IsUUID } from 'class-validator';
import { BaseCommand } from './base.command';

export abstract class BaseAuthenticatedCommand extends BaseCommand {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;
}
