import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class DeleteEmailTemplateCommand extends OrganizationCommand {
  @IsUUID()
  readonly templateId: string;
}
