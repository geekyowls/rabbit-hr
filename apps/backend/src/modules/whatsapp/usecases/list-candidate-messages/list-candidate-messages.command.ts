import { IsUUID } from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';

export class ListCandidateWhatsappMessagesCommand extends BasePaginatedCommand {
  @IsUUID()
  readonly candidateId: string;
}
