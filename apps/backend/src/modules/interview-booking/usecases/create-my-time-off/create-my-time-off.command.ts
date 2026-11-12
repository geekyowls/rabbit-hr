import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateTimeOffDto } from '../../dtos/interview-booking.dto';

export class CreateMyTimeOffCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => CreateTimeOffDto)
  readonly payload: CreateTimeOffDto;
}
