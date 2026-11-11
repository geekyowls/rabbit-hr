import { JobRepository } from '@db/repositories';
import { safeUserSelect } from '@shared/helpers/safe-user-select';

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
    .where('job.organizationId = :organizationId', { organizationId });
}
