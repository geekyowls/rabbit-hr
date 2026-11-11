import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { ApplicationRepository } from '@db/repositories';
import {
  APPLICATION_SEARCH_CLAUSE,
  buildApplicationQuery,
} from '../application-query';
import { ListApplicationsCommand } from './list-applications.command';

@Injectable()
export class ListApplications {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(command: ListApplicationsCommand) {
    const qb = buildApplicationQuery(
      this.applicationRepository,
      command.organizationId,
    );

    if (command.jobId) {
      qb.andWhere('application.jobId = :jobId', { jobId: command.jobId });
    }
    if (command.clientId) {
      qb.andWhere('job.clientId = :clientId', { clientId: command.clientId });
    }
    if (command.candidateId) {
      qb.andWhere('application.candidateId = :candidateId', {
        candidateId: command.candidateId,
      });
    }
    if (command.stage) {
      qb.andWhere('application.stage = :stage', { stage: command.stage });
    }
    if (command.shortlisted !== undefined) {
      qb.andWhere('application.shortlisted = :shortlisted', {
        shortlisted: command.shortlisted,
      });
    }
    if (command.ownerId) {
      qb.andWhere('application.ownerId = :ownerId', {
        ownerId: command.ownerId,
      });
    }
    if (command.search) {
      qb.andWhere(APPLICATION_SEARCH_CLAUSE, { search: `%${command.search}%` });
    }

    qb.orderBy('application.stageChangedAt', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [applications, total] = await qb.getManyAndCount();

    return {
      data: applications,
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
