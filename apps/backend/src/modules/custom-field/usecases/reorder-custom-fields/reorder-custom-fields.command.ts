import { ArrayMinSize, IsArray, IsEnum, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CustomFieldEntityType } from '@db/enums';

export class ReorderCustomFieldsCommand extends OrganizationCommand {
  @IsEnum(CustomFieldEntityType)
  readonly entity: CustomFieldEntityType;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  readonly ids: string[];
}
