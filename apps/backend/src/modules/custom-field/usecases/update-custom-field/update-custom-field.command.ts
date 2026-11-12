import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateCustomFieldDto } from '../../dtos/custom-field.dto';

export class UpdateCustomFieldCommand extends OrganizationCommand {
  @IsUUID()
  readonly customFieldId: string;

  @ValidateNested()
  @Type(() => UpdateCustomFieldDto)
  readonly payload: UpdateCustomFieldDto;
}
