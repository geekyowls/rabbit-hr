import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRepository, OrganizationRepository } from '@db/repositories';
import {
  buildOpenJobsQuery,
  CAREERS_JOB_DETAIL_SELECT,
  findCareersOrganization,
} from '../careers-query';
import { GetCareersJobCommand } from './get-careers-job.command';

@Injectable()
export class GetCareersJob {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly jobRepository: JobRepository,
  ) {}

  async execute(command: GetCareersJobCommand) {
    const organization = await findCareersOrganization(
      this.organizationRepository,
      command.orgSlug,
    );
    const job = await buildOpenJobsQuery(
      this.jobRepository,
      organization.id,
      CAREERS_JOB_DETAIL_SELECT,
    )
      .andWhere('job.id = :jobId', { jobId: command.jobId })
      .getOne();
    if (!job) {
      throw new NotFoundException('This role is no longer open');
    }
    const { ownerId: _ownerId, clientId: _clientId, ...publicJob } = job;
    return publicJob;
  }
}
