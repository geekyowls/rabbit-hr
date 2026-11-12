import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateCandidateDocumentDto } from '../../dtos/document.dto';

export class CreateCandidateDocumentCommand extends OrganizationCommand {
  @IsUUID()
  readonly candidateId: string;

  @ValidateNested()
  @Type(() => CreateCandidateDocumentDto)
  readonly payload: CreateCandidateDocumentDto;
}
