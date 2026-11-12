import { In } from 'typeorm';
import { JobEntity } from '@db/entities';
import { JobRepository, UserRepository } from '@db/repositories';
import {
  SAFE_USER_FIELDS,
  safeUserSelect,
} from '@shared/helpers/safe-user-select';

export const JOB_CLIENT_SELECT = [
  'client.id',
  'client.name',
  'client.logoUrl',
  'client.brandColor',
];

export function buildJobQuery(
  jobRepository: JobRepository,
  organizationId: string,
) {
  return jobRepository
    .createQueryBuilder('job')
    .leftJoin('job.client', 'client')
    .addSelect(JOB_CLIENT_SELECT)
    .leftJoin('job.owner', 'owner')
    .addSelect(safeUserSelect('owner'))
    .leftJoin('job.hiringManager', 'hiringManager')
    .addSelect(safeUserSelect('hiringManager'))
    .leftJoin('job.recruiter', 'recruiter')
    .addSelect(safeUserSelect('recruiter'))
    .where('job.organizationId = :organizationId', { organizationId });
}

export async function attachHiringTeams<T extends JobEntity>(
  userRepository: UserRepository,
  organizationId: string,
  jobs: T[],
) {
  const ids = [...new Set(jobs.flatMap((job) => job.hiringTeamIds ?? []))];
  const users = ids.length
    ? await userRepository.find({
        where: { id: In(ids), organizationId },
        select: [...SAFE_USER_FIELDS],
      })
    : [];
  const byId = new Map(users.map((user) => [user.id, user]));
  return jobs.map((job) => ({
    ...job,
    hiringTeam: (job.hiringTeamIds ?? [])
      .map((id) => byId.get(id))
      .filter((user) => user !== undefined),
  }));
}
