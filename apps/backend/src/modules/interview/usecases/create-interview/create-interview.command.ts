import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateInterviewDto } from '../../dtos/interview.dto';

export class CreateInterviewCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => CreateInterviewDto)
  readonly payload: CreateInterviewDto;
}
