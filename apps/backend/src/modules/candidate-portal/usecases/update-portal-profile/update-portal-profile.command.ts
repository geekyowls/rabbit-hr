import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { PortalCandidateCommand } from '../portal-candidate.command';
import { UpdatePortalProfileDto } from '../../dtos/portal.dto';

export class UpdatePortalProfileCommand extends PortalCandidateCommand {
  @ValidateNested()
  @Type(() => UpdatePortalProfileDto)
  readonly payload: UpdatePortalProfileDto;
}
