import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ClientRepository,
  JobRepository,
  UserRepository,
} from '@db/repositories';
import { JobStatus } from '@db/enums';
import { pickDefined } from '@shared/helpers/pick-defined';
import {
  assertJobReferences,
  normalizeScreeningQuestions,
} from '../job-validation';
import { GetJob } from '../get-job/get-job.usecase';
import { UpdateJobCommand } from './update-job.command';

@Injectable()
export class UpdateJob {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly clientRepository: ClientRepository,
    private readonly userRepository: UserRepository,
    private readonly getJob: GetJob,
  ) {}

  async execute(command: UpdateJobCommand) {
    const job = await this.jobRepository.findOne({
      where: { id: command.jobId, organizationId: command.organizationId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const { screeningQuestions, ...rest } = pickDefined(command.payload);
    await assertJobReferences(
      this.clientRepository,
      this.userRepository,
      command.organizationId,
      rest.clientId,
      rest.ownerId,
    );

    Object.assign(job, rest);
    if (screeningQuestions) {
      job.screeningQuestions = normalizeScreeningQuestions(screeningQuestions);
    }
    if (job.status === JobStatus.PUBLISHED && !job.publishedAt) {
      job.publishedAt = new Date();
    }

    await this.jobRepository.save(job);
    return this.getJob.execute(job.id, command.organizationId);
  }
}
