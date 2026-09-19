import { IsBoolean, IsOptional } from 'class-validator';
import { OrganizationCommand } from '../../../shared/commands/organization.command';

export class ListUsersDropdownCommand extends OrganizationCommand {
  @IsOptional()
  @IsBoolean()
  readonly teamOnly?: boolean;
}
