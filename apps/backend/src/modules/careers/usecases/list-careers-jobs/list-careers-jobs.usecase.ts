import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { JobRepository, OrganizationRepository } from '@db/repositories';
import {
  buildOpenJobsQuery,
  CAREERS_JOB_SELECT,
  findCareersOrganization,
} from '../careers-query';
import { ListCareersJobsCommand } from './list-careers-jobs.command';

@Injectable()
export class ListCareersJobs {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly jobRepository: JobRepository,
  ) {}

  async execute(command: ListCareersJobsCommand) {
    const organization = await findCareersOrganization(
      this.organizationRepository,
      command.orgSlug,
    );

    const qb = buildOpenJobsQuery(
      this.jobRepository,
      organization.id,
      CAREERS_JOB_SELECT,
    );
    if (command.search) {
      qb.andWhere(
        `(job.title ILIKE :search OR job.reference ILIKE :search OR array_to_string(job.skills, ' ') ILIKE :search)`,
        { search: `%${command.search}%` },
      );
    }
    if (command.employmentType) {
      qb.andWhere('job.employmentType = :employmentType', {
        employmentType: command.employmentType,
      });
    }
    if (command.location) {
      qb.andWhere('job.location ILIKE :location', {
        location: `%${command.location}%`,
      });
    }

    qb.orderBy('job.publishedAt', 'DESC', 'NULLS LAST')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [jobs, total] = await qb.getManyAndCount();
    return {
      data: jobs,
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
