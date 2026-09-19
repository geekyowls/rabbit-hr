import { IsNotEmpty, IsUUID } from 'class-validator';
import { OrganizationCommand } from '../../../shared/commands/organization.command';

export class GetUserDescendantsCommand extends OrganizationCommand {
  @IsUUID()
  @IsNotEmpty()
  targetUserId!: string;
}
