import { IsEnum, IsOptional } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { EmailTemplateCategory } from '@db/enums';

export class ListEmailTemplatesCommand extends OrganizationCommand {
  @IsEnum(EmailTemplateCategory)
  @IsOptional()
  readonly category?: EmailTemplateCategory;
}
