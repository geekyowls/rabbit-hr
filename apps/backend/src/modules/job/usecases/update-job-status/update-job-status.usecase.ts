import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityRepository, JobRepository } from '@db/repositories';
import { ActivityType, JobStatus } from '@db/enums';
import { GetJob } from '../get-job/get-job.usecase';
import { UpdateJobStatusCommand } from './update-job-status.command';

@Injectable()
export class UpdateJobStatus {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly getJob: GetJob,
  ) {}

  async execute(command: UpdateJobStatusCommand) {
    const job = await this.jobRepository.findOne({
      where: { id: command.jobId, organizationId: command.organizationId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const previous = job.status;
    if (previous !== command.status) {
      job.status = command.status;
      if (command.status === JobStatus.PUBLISHED && !job.publishedAt) {
        job.publishedAt = new Date();
      }
      await this.jobRepository.save(job);
      await this.activityRepository.record({
        organizationId: command.organizationId,
        jobId: job.id,
        clientId: job.clientId,
        type: ActivityType.STAGE_CHANGE,
        title: `Job status changed to ${command.status.replace('_', ' ')}`,
        metadata: { from: previous, to: command.status },
        actorId: command.userId,
      });
    }

    return this.getJob.execute(job.id, command.organizationId);
  }
}
