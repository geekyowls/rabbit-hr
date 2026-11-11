import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { ApplicationStage, CandidateSource } from '@db/enums';

export class CreateApplicationCommand extends OrganizationCommand {
  @IsUUID()
  readonly candidateId: string;

  @IsUUID()
  readonly jobId: string;

  @IsEnum(ApplicationStage)
  @IsOptional()
  readonly stage?: ApplicationStage;

  @IsEnum(CandidateSource)
  @IsOptional()
  readonly source?: CandidateSource;

  @IsUUID()
  @IsOptional()
  readonly ownerId?: string;
}
