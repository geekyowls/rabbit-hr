import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class ListCandidateDocumentsCommand extends OrganizationCommand {
  @IsUUID()
  readonly candidateId: string;
}
