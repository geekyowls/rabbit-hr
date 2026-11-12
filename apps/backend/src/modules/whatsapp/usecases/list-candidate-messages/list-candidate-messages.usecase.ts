import { Injectable, NotFoundException } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import {
  CandidateRepository,
  WhatsappMessageRepository,
} from '@db/repositories';
import { safeUserSelect } from '@shared/helpers/safe-user-select';
import { ListCandidateWhatsappMessagesCommand } from './list-candidate-messages.command';

@Injectable()
export class ListCandidateWhatsappMessages {
  constructor(
    private readonly candidates: CandidateRepository,
    private readonly messages: WhatsappMessageRepository,
  ) {}

  async execute(command: ListCandidateWhatsappMessagesCommand) {
    const exists = await this.candidates.exists({
      where: {
        id: command.candidateId,
        organizationId: command.organizationId,
      },
    });
    if (!exists) throw new NotFoundException('Candidate not found');

    const [messages, total] = await this.messages
      .createQueryBuilder('message')
      .leftJoin('message.sender', 'sender')
      .addSelect(safeUserSelect('sender'))
      .leftJoin('message.application', 'application')
      .addSelect(['application.id', 'application.jobId'])
      .leftJoin('application.job', 'job')
      .addSelect(['job.id', 'job.title', 'job.reference'])
      .where('message.organizationId = :organizationId', {
        organizationId: command.organizationId,
      })
      .andWhere('message.candidateId = :candidateId', {
        candidateId: command.candidateId,
      })
      .orderBy('message.createdAt', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit)
      .getManyAndCount();

    return {
      data: messages,
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
