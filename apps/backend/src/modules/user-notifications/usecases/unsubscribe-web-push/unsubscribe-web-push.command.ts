import { IsNotEmpty, IsString } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class UnsubscribeWebPushCommand extends OrganizationCommand {
  @IsString()
  @IsNotEmpty()
  readonly endpoint: string;
}
