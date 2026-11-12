import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateInterviewDto } from '../../dtos/interview.dto';

export class UpdateInterviewCommand extends OrganizationCommand {
  @IsUUID()
  readonly interviewId: string;

  @ValidateNested()
  @Type(() => UpdateInterviewDto)
  readonly payload: UpdateInterviewDto;
}
