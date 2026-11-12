import { IsUUID } from 'class-validator';
import { PortalCandidateCommand } from '../portal-candidate.command';

export class PortalApplicationCommand extends PortalCandidateCommand {
  @IsUUID()
  readonly applicationId: string;
}
