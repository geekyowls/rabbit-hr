import { IsUUID } from 'class-validator';
import { PortalCandidateCommand } from '../portal-candidate.command';

export class GetPortalDocumentDownloadUrlCommand extends PortalCandidateCommand {
  @IsUUID()
  readonly documentId: string;
}
