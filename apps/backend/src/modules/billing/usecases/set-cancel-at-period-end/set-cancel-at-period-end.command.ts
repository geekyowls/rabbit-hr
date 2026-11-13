import { IsBoolean } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class SetCancelAtPeriodEndCommand extends OrganizationCommand {
  @IsBoolean()
  readonly cancelAtPeriodEnd: boolean;
}
