import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateBookingLinkDto } from '../../dtos/interview-booking.dto';

export class CreateBookingLinkCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => CreateBookingLinkDto)
  readonly payload: CreateBookingLinkDto;
}
