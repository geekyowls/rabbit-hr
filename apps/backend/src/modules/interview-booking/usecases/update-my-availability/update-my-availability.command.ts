import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateAvailabilityDto } from '../../dtos/interview-booking.dto';

export class UpdateMyAvailabilityCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => UpdateAvailabilityDto)
  readonly payload: UpdateAvailabilityDto;
}
