import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateEmailTemplateDto } from '../../dtos/email-template.dto';

export class UpdateEmailTemplateCommand extends OrganizationCommand {
  @IsUUID()
  readonly templateId: string;

  @ValidateNested()
  @Type(() => UpdateEmailTemplateDto)
  readonly payload: UpdateEmailTemplateDto;
}
