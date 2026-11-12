import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateEmailTemplateDto } from '../../dtos/email-template.dto';

export class CreateEmailTemplateCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => CreateEmailTemplateDto)
  readonly payload: CreateEmailTemplateDto;
}
