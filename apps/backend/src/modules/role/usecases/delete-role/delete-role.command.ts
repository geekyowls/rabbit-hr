import { IsNotEmpty, IsString } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class DeleteRoleCommand extends OrganizationCommand {
  @IsString()
  @IsNotEmpty()
  readonly roleId: string;
}
