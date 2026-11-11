import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRepository, UserRepository } from '@db/repositories';
import { attachHiringTeams, buildJobQuery } from '../job-query';

@Injectable()
export class GetJob {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(jobId: string, organizationId: string) {
    const job = await buildJobQuery(this.jobRepository, organizationId)
      .andWhere('job.id = :jobId', { jobId })
      .getOne();
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const [stats, [withTeam]] = await Promise.all([
      this.jobRepository.getApplicationStats(organizationId, [jobId]),
      attachHiringTeams(this.userRepository, organizationId, [job]),
    ]);
    return { ...withTeam, ...stats.get(jobId)! };
  }
}
