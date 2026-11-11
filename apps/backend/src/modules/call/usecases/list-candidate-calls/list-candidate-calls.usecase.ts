import { Injectable, NotFoundException } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { CandidateCallRepository, CandidateRepository } from '@db/repositories';
import { buildCallQuery } from '../call-query';
import { ListCandidateCallsCommand } from './list-candidate-calls.command';

@Injectable()
export class ListCandidateCalls {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly callRepository: CandidateCallRepository,
  ) {}

  async execute(command: ListCandidateCallsCommand) {
    const exists = await this.candidateRepository.exists({
      where: {
        id: command.candidateId,
        organizationId: command.organizationId,
      },
    });
    if (!exists) throw new NotFoundException('Candidate not found');

    const [calls, total] = await buildCallQuery(
      this.callRepository,
      command.organizationId,
    )
      .andWhere('call.candidateId = :candidateId', {
        candidateId: command.candidateId,
      })
      .orderBy('call.createdAt', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit)
      .getManyAndCount();

    return {
      data: calls,
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
