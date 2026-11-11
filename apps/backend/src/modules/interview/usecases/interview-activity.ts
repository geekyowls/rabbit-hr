import { EntityManager } from 'typeorm';
import { InterviewEntity, JobEntity } from '@db/entities';
import { ActivityRepository } from '@db/repositories';
import { ActivityType } from '@db/enums';

export interface InterviewActivityInput {
  interview: InterviewEntity;
  event: string;
  title: string;
  actorId: string | null;
  body?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordInterviewActivity(
  activityRepository: ActivityRepository,
  input: InterviewActivityInput,
  manager?: EntityManager,
): Promise<void> {
  const { interview } = input;
  const job = await (manager ?? activityRepository.manager)
    .getRepository(JobEntity)
    .findOne({ where: { id: interview.jobId }, select: ['id', 'clientId'] });
  await activityRepository.record(
    {
      organizationId: interview.organizationId,
      candidateId: interview.candidateId,
      applicationId: interview.applicationId,
      jobId: interview.jobId,
      clientId: job?.clientId ?? null,
      type: ActivityType.INTERVIEW,
      title: input.title,
      body: input.body ?? null,
      metadata: {
        kind: 'interview',
        event: input.event,
        interviewId: interview.id,
        interviewTitle: interview.title,
        scheduledAt: interview.scheduledAt,
        ...input.metadata,
      },
      actorId: input.actorId,
    },
    manager,
  );
}
