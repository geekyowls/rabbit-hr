import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class InviteCandidateToPortalCommand extends OrganizationCommand {
  @IsUUID()
  readonly candidateId: string;
}
