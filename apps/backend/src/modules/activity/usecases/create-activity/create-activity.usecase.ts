import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ActivityRepository,
  ApplicationRepository,
  CandidateRepository,
  ClientRepository,
  JobRepository,
} from '@db/repositories';
import { ActivityType } from '@db/enums';
import { buildActivityQuery } from '../activity-query';
import { CreateActivityCommand } from './create-activity.command';

const DEFAULT_TITLES: Record<string, string> = {
  [ActivityType.NOTE]: 'Note added',
  [ActivityType.CALL]: 'Call logged',
  [ActivityType.EMAIL]: 'Email logged',
};

@Injectable()
export class CreateActivity {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly jobRepository: JobRepository,
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: CreateActivityCommand) {
    const { organizationId } = command;
    let { candidateId, jobId, clientId } = command;

    if (command.applicationId) {
      const application = await this.applicationRepository.findOne({
        where: { id: command.applicationId, organizationId },
        relations: { job: true },
      });
      if (!application) throw new BadRequestException('Application not found');
      candidateId = application.candidateId;
      jobId = application.jobId;
      clientId = application.job.clientId ?? undefined;
    }

    if (!candidateId && !jobId && !clientId) {
      throw new BadRequestException(
        'Link the note to a candidate, application, job or client',
      );
    }

    const checks: Array<[string | undefined, () => Promise<boolean>, string]> =
      [
        [
          candidateId,
          () =>
            this.candidateRepository.exists({
              where: { id: candidateId, organizationId },
            }),
          'Candidate not found',
        ],
        [
          jobId,
          () =>
            this.jobRepository.exists({ where: { id: jobId, organizationId } }),
          'Job not found',
        ],
        [
          clientId,
          () =>
            this.clientRepository.exists({
              where: { id: clientId, organizationId },
            }),
          'Client not found',
        ],
      ];
    for (const [id, check, message] of checks) {
      if (id && !(await check())) throw new BadRequestException(message);
    }

    const activity = await this.activityRepository.record({
      organizationId,
      candidateId: candidateId ?? null,
      applicationId: command.applicationId ?? null,
      jobId: jobId ?? null,
      clientId: clientId ?? null,
      type: command.type,
      title: command.title || DEFAULT_TITLES[command.type],
      body: command.body,
      actorId: command.userId,
    });

    return buildActivityQuery(this.activityRepository, organizationId)
      .andWhere('activity.id = :id', { id: activity.id })
      .getOne();
  }
}
