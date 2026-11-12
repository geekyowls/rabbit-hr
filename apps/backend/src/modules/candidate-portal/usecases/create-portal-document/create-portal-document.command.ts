import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { PortalCandidateCommand } from '../portal-candidate.command';
import { CreatePortalDocumentDto } from '../../dtos/portal.dto';

export class CreatePortalDocumentCommand extends PortalCandidateCommand {
  @ValidateNested()
  @Type(() => CreatePortalDocumentDto)
  readonly payload: CreatePortalDocumentDto;
}
