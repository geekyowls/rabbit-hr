import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class DeleteCustomFieldCommand extends OrganizationCommand {
  @IsUUID()
  readonly customFieldId: string;
}
