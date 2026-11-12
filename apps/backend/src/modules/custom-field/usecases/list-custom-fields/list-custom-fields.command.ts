import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CustomFieldEntityType } from '@db/enums';

export class ListCustomFieldsCommand extends OrganizationCommand {
  @IsEnum(CustomFieldEntityType)
  @IsOptional()
  readonly entity?: CustomFieldEntityType;

  @IsBoolean()
  @IsOptional()
  readonly activeOnly?: boolean;
}
