import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateCandidateDto } from '../../dtos/update-candidate.dto';

export class UpdateCandidateCommand extends OrganizationCommand {
  @IsUUID()
  readonly candidateId: string;

  @ValidateNested()
  @Type(() => UpdateCandidateDto)
  readonly payload: UpdateCandidateDto;
}
