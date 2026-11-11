import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRepository } from '@db/repositories';
import { buildJobQuery } from '../job-query';

@Injectable()
export class GetJob {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(jobId: string, organizationId: string) {
    const job = await buildJobQuery(this.jobRepository, organizationId)
      .andWhere('job.id = :jobId', { jobId })
      .getOne();
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const stats = await this.jobRepository.getApplicationStats(organizationId, [
      jobId,
    ]);
    return { ...job, ...stats.get(jobId)! };
  }
}
