import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { ReplacePipelineStagesDto } from '../../dtos/pipeline-stage.dto';

export class ReplacePipelineStagesCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => ReplacePipelineStagesDto)
  readonly payload: ReplacePipelineStagesDto;
}
