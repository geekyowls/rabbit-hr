import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { JobRepository } from '@db/repositories';
import { buildJobQuery } from '../job-query';
import { ListJobsCommand } from './list-jobs.command';

@Injectable()
export class ListJobs {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(command: ListJobsCommand) {
    const qb = buildJobQuery(this.jobRepository, command.organizationId);

    if (command.status) {
      qb.andWhere('job.status = :status', { status: command.status });
    }
    if (command.clientId) {
      qb.andWhere('job.clientId = :clientId', { clientId: command.clientId });
    }
    if (command.employmentType) {
      qb.andWhere('job.employmentType = :employmentType', {
        employmentType: command.employmentType,
      });
    }
    if (command.ownerId) {
      qb.andWhere('job.ownerId = :ownerId', { ownerId: command.ownerId });
    }
    if (command.search) {
      qb.andWhere(
        `(job.title ILIKE :search OR job.reference ILIKE :search OR job.location ILIKE :search OR client.name ILIKE :search OR array_to_string(job.skills, ' ') ILIKE :search)`,
        { search: `%${command.search}%` },
      );
    }

    qb.orderBy('job.createdAt', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [jobs, total] = await qb.getManyAndCount();
    const stats = await this.jobRepository.getApplicationStats(
      command.organizationId,
      jobs.map((j) => j.id),
    );

    return {
      data: jobs.map((job) => ({ ...job, ...stats.get(job.id)! })),
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
