import { IsOptional, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class GetInboxStatsCommand extends OrganizationCommand {
  @IsUUID()
  @IsOptional()
  readonly mailboxId?: string;
}
