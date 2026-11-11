import { ActivityRepository } from '@db/repositories';
import { safeUserSelect } from '@shared/helpers/safe-user-select';

export function buildActivityQuery(
  activityRepository: ActivityRepository,
  organizationId: string,
) {
  return activityRepository
    .createQueryBuilder('activity')
    .leftJoin('activity.actor', 'actor')
    .addSelect(safeUserSelect('actor'))
    .where('activity.organizationId = :organizationId', { organizationId });
}
