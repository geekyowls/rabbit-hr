import { Type } from 'class-transformer';
import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { SubmitScorecardDto } from '../../dtos/interview.dto';

export class SubmitScorecardCommand extends OrganizationCommand {
  @IsUUID()
  readonly interviewId: string;

  @IsArray()
  @IsString({ each: true })
  readonly permissions: string[];

  @ValidateNested()
  @Type(() => SubmitScorecardDto)
  readonly payload: SubmitScorecardDto;
}
