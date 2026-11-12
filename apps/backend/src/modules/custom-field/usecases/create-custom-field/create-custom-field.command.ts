import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateCustomFieldDto } from '../../dtos/custom-field.dto';

export class CreateCustomFieldCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => CreateCustomFieldDto)
  readonly payload: CreateCustomFieldDto;
}
