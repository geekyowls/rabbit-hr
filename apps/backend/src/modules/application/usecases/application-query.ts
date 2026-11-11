import { ApplicationRepository } from '@db/repositories';
import { safeUserSelect } from '@shared/helpers/safe-user-select';

const CANDIDATE_SELECT = [
  'candidate.id',
  'candidate.firstName',
  'candidate.lastName',
  'candidate.email',
  'candidate.phone',
  'candidate.location',
  'candidate.headline',
  'candidate.currentTitle',
  'candidate.skills',
  'candidate.tags',
  'candidate.rightToWork',
];

const JOB_SELECT = ['job.id', 'job.reference', 'job.title', 'job.clientId'];

const CLIENT_SELECT = ['client.id', 'client.name'];

export function buildApplicationQuery(
  applicationRepository: ApplicationRepository,
  organizationId: string,
) {
  return applicationRepository
    .createQueryBuilder('application')
    .innerJoin('application.candidate', 'candidate')
    .addSelect(CANDIDATE_SELECT)
    .innerJoin('application.job', 'job')
    .addSelect(JOB_SELECT)
    .leftJoin('job.client', 'client')
    .addSelect(CLIENT_SELECT)
    .leftJoin('application.owner', 'owner')
    .addSelect(safeUserSelect('owner'))
    .where('application.organizationId = :organizationId', { organizationId });
}

export const APPLICATION_SEARCH_CLAUSE = `(candidate.firstName ILIKE :search OR candidate.lastName ILIKE :search OR CONCAT(candidate.firstName, ' ', candidate.lastName) ILIKE :search OR candidate.email ILIKE :search OR job.title ILIKE :search OR job.reference ILIKE :search)`;
