import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class DeleteMyTimeOffCommand extends OrganizationCommand {
  @IsUUID()
  readonly timeOffId: string;
}
