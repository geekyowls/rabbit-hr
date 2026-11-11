import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateCandidateDto } from '../../dtos/create-candidate.dto';

export class CreateCandidateCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => CreateCandidateDto)
  readonly payload: CreateCandidateDto;
}
