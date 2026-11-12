import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class DeleteApplicationCommand extends OrganizationCommand {
  @IsUUID()
  readonly applicationId: string;
}
