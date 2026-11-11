import { BadRequestException } from '@nestjs/common';
import {
  ApplicationRepository,
  CandidateRepository,
  ClientRepository,
  JobRepository,
  TaskRepository,
  UserRepository,
} from '@db/repositories';
import { safeUserSelect } from '@shared/helpers/safe-user-select';

export function buildTaskQuery(
  taskRepository: TaskRepository,
  organizationId: string,
) {
  return taskRepository
    .createQueryBuilder('task')
    .leftJoin('task.assignee', 'assignee')
    .addSelect(safeUserSelect('assignee'))
    .leftJoin('task.candidate', 'candidate')
    .addSelect(['candidate.id', 'candidate.firstName', 'candidate.lastName'])
    .leftJoin('task.job', 'job')
    .addSelect(['job.id', 'job.title', 'job.reference'])
    .leftJoin('task.client', 'client')
    .addSelect(['client.id', 'client.name'])
    .where('task.organizationId = :organizationId', { organizationId });
}

export interface TaskLinks {
  assigneeId?: string | null;
  candidateId?: string | null;
  applicationId?: string | null;
  jobId?: string | null;
  clientId?: string | null;
}

export interface TaskLinkRepositories {
  userRepository: UserRepository;
  candidateRepository: CandidateRepository;
  applicationRepository: ApplicationRepository;
  jobRepository: JobRepository;
  clientRepository: ClientRepository;
}

export async function assertTaskLinks(
  repos: TaskLinkRepositories,
  organizationId: string,
  links: TaskLinks,
): Promise<void> {
  await repos.userRepository.assertInOrganization(
    links.assigneeId,
    organizationId,
  );
  const checks: Array<
    [string | null | undefined, () => Promise<boolean>, string]
  > = [
    [
      links.candidateId,
      () =>
        repos.candidateRepository.exists({
          where: { id: links.candidateId!, organizationId },
        }),
      'Candidate not found',
    ],
    [
      links.applicationId,
      () =>
        repos.applicationRepository.exists({
          where: { id: links.applicationId!, organizationId },
        }),
      'Application not found',
    ],
    [
      links.jobId,
      () =>
        repos.jobRepository.exists({
          where: { id: links.jobId!, organizationId },
        }),
      'Job not found',
    ],
    [
      links.clientId,
      () =>
        repos.clientRepository.exists({
          where: { id: links.clientId!, organizationId },
        }),
      'Client not found',
    ],
  ];
  for (const [id, check, message] of checks) {
    if (id && !(await check())) throw new BadRequestException(message);
  }
}
