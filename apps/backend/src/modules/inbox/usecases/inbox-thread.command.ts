import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class InboxThreadCommand extends OrganizationCommand {
  @IsUUID()
  readonly threadId: string;
}
