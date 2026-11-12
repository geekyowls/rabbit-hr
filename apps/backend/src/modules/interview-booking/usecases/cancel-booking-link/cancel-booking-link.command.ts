import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class CancelBookingLinkCommand extends OrganizationCommand {
  @IsUUID()
  readonly bookingLinkId: string;
}
