import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { InterviewBookingLinkStatus } from '@db/enums';

export class ListBookingLinksCommand extends OrganizationCommand {
  @IsUUID()
  @IsOptional()
  readonly applicationId?: string;

  @IsEnum(InterviewBookingLinkStatus)
  @IsOptional()
  readonly status?: InterviewBookingLinkStatus;
}
