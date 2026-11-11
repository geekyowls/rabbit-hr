import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class DeleteClientCommand extends OrganizationCommand {
  @IsUUID()
  readonly clientId: string;
}
