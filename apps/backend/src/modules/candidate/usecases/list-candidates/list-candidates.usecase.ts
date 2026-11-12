import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { CandidateRepository } from '@db/repositories';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { safeUserSelect } from '@shared/helpers/safe-user-select';
import { ListCandidatesCommand } from './list-candidates.command';

@Injectable()
export class ListCandidates {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly pipelineStageService: PipelineStageService,
  ) {}

  async execute(command: ListCandidatesCommand) {
    const qb = this.candidateRepository
      .createQueryBuilder('candidate')
      .leftJoin('candidate.owner', 'owner')
      .addSelect(safeUserSelect('owner'))
      .where('candidate.organizationId = :organizationId', {
        organizationId: command.organizationId,
      });

    if (command.search) {
      qb.andWhere(
        `(candidate.firstName ILIKE :search OR candidate.lastName ILIKE :search OR CONCAT(candidate.firstName, ' ', candidate.lastName) ILIKE :search OR candidate.email ILIKE :search OR candidate.currentTitle ILIKE :search OR candidate.headline ILIKE :search OR array_to_string(candidate.skills, ' ') ILIKE :search)`,
        { search: `%${command.search}%` },
      );
    }
    if (command.tags?.length) {
      qb.andWhere('candidate.tags && :tags', { tags: command.tags });
    }
    if (command.source) {
      qb.andWhere('candidate.source = :source', { source: command.source });
    }
    if (command.rightToWork) {
      qb.andWhere('candidate.rightToWork = :rightToWork', {
        rightToWork: command.rightToWork,
      });
    }
    if (command.ownerId) {
      qb.andWhere('candidate.ownerId = :ownerId', {
        ownerId: command.ownerId,
      });
    }
    if (command.jobId || command.stage || command.stageCategory) {
      const conditions = ['a."candidateId" = candidate.id'];
      if (command.jobId) conditions.push('a."jobId" = :jobId');
      if (command.stage) conditions.push('a.stage = :stage');
      const categoryStages = command.stageCategory
        ? await this.pipelineStageService.getKeysByCategory(
            command.organizationId,
            [command.stageCategory],
          )
        : [];
      if (command.stageCategory) {
        conditions.push('a.stage = ANY(:categoryStages)');
      }
      qb.andWhere(
        `EXISTS (SELECT 1 FROM applications a WHERE ${conditions.join(' AND ')})`,
        { jobId: command.jobId, stage: command.stage, categoryStages },
      );
    }

    qb.orderBy('candidate.createdAt', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [candidates, total] = await qb.getManyAndCount();
    const stats = await this.candidateRepository.getApplicationStats(
      command.organizationId,
      candidates.map((c) => c.id),
    );

    return {
      data: candidates.map((candidate) => ({
        ...candidate,
        ...stats.get(candidate.id)!,
      })),
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
