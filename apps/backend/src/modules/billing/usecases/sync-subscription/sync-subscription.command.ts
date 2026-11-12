import { IsNotEmpty, IsString } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class SyncSubscriptionCommand extends OrganizationCommand {
  @IsString()
  @IsNotEmpty()
  readonly subscriptionId: string;
}
