import { IsNotEmpty, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class RevokeSessionCommand extends OrganizationCommand {
  @IsNotEmpty()
  @IsUUID()
  readonly sessionId: string;
}
