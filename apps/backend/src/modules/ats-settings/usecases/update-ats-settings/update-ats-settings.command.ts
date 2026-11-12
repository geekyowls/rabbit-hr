import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateAtsSettingsDto } from '../../dtos/ats-settings.dto';

export class UpdateAtsSettingsCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => UpdateAtsSettingsDto)
  readonly payload: UpdateAtsSettingsDto;
}
