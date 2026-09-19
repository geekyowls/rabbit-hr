import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { OrganizationCommand } from '../../../shared/commands/organization.command';

export class SetManagerCommand extends OrganizationCommand {
  @IsUUID()
  @IsNotEmpty()
  targetUserId!: string;

  @IsUUID()
  @IsOptional()
  managerId!: string | null;
}
