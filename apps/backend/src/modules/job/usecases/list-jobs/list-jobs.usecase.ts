import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { JobRepository, UserRepository } from '@db/repositories';
import { attachHiringTeams, buildJobQuery } from '../job-query';
import { ListJobsCommand } from './list-jobs.command';

@Injectable()
export class ListJobs {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly userRepository: UserRepository,
  ) {}

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
    if (command.department) {
      qb.andWhere('LOWER(job.department) = LOWER(:department)', {
        department: command.department,
      });
    }
    if (command.hiringManagerId) {
      qb.andWhere('job.hiringManagerId = :hiringManagerId', {
        hiringManagerId: command.hiringManagerId,
      });
    }
    if (command.recruiterId) {
      qb.andWhere('job.recruiterId = :recruiterId', {
        recruiterId: command.recruiterId,
      });
    }
    if (command.search) {
      qb.andWhere(
        `(job.title ILIKE :search OR job.reference ILIKE :search OR job.location ILIKE :search OR job.department ILIKE :search OR client.name ILIKE :search OR array_to_string(job.skills, ' ') ILIKE :search)`,
        { search: `%${command.search}%` },
      );
    }

    qb.orderBy('job.createdAt', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [jobs, total] = await qb.getManyAndCount();
    const [stats, withTeams] = await Promise.all([
      this.jobRepository.getApplicationStats(
        command.organizationId,
        jobs.map((j) => j.id),
      ),
      attachHiringTeams(this.userRepository, command.organizationId, jobs),
    ]);

    return {
      data: withTeams.map((job) => ({ ...job, ...stats.get(job.id)! })),
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
