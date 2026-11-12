import { IsUUID } from 'class-validator';
import { BaseCommand } from '@boilerplate/core';

export class PortalCandidateCommand extends BaseCommand {
  @IsUUID()
  readonly candidateId: string;

  @IsUUID()
  readonly organizationId: string;
}
