import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class WhatsappOrganizationCommand extends OrganizationCommand {}

export class WhatsappTemplateCommand extends OrganizationCommand {
  @IsUUID()
  readonly templateId: string;
}
