import { IsUUID } from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';

export class ListCandidateCallsCommand extends BasePaginatedCommand {
  @IsUUID()
  readonly candidateId: string;
}
