import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CandidateSource } from '@db/enums';
import { STAGE_KEY_PATTERN } from '@modules/pipeline-stage/dtos/pipeline-stage.dto';

export class CreateApplicationCommand extends OrganizationCommand {
  @IsUUID()
  readonly candidateId: string;

  @IsUUID()
  readonly jobId: string;

  @IsString()
  @Matches(STAGE_KEY_PATTERN)
  @IsOptional()
  readonly stage?: string;

  @IsEnum(CandidateSource)
  @IsOptional()
  readonly source?: CandidateSource;

  @IsUUID()
  @IsOptional()
  readonly ownerId?: string;
}
