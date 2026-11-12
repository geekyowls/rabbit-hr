import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class DeleteClientContactCommand extends OrganizationCommand {
  @IsUUID()
  readonly clientId: string;

  @IsUUID()
  readonly contactId: string;
}
