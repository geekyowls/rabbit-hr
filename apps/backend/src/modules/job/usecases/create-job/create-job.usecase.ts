import { Injectable } from '@nestjs/common';
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
import { CreateJobCommand } from './create-job.command';

@Injectable()
export class CreateJob {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly clientRepository: ClientRepository,
    private readonly userRepository: UserRepository,
    private readonly getJob: GetJob,
  ) {}

  async execute(command: CreateJobCommand) {
    const { payload } = command;
    await assertJobReferences(
      this.clientRepository,
      this.userRepository,
      command.organizationId,
      payload.clientId,
      payload.ownerId,
    );

    const status = payload.status ?? JobStatus.DRAFT;
    const reference = await this.jobRepository.nextReference(
      command.organizationId,
    );

    const job = await this.jobRepository.save(
      this.jobRepository.create({
        ...pickDefined(payload),
        screeningQuestions: normalizeScreeningQuestions(
          payload.screeningQuestions ?? [],
        ),
        reference,
        status,
        publishedAt: status === JobStatus.PUBLISHED ? new Date() : null,
        ownerId: payload.ownerId ?? command.userId,
        organizationId: command.organizationId,
      }),
    );

    return this.getJob.execute(job.id, command.organizationId);
  }
}
