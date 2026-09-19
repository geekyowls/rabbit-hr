import { IsNotEmpty, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class MarkNotificationReadCommand extends OrganizationCommand {
  @IsUUID()
  @IsNotEmpty()
  readonly notificationId: string;
}
