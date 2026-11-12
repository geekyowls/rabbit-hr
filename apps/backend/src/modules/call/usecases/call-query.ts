import { NotFoundException } from '@nestjs/common';
import { CandidateCallRepository } from '@db/repositories';
import { safeUserSelect } from '@shared/helpers/safe-user-select';

export function buildCallQuery(
  callRepository: CandidateCallRepository,
  organizationId: string,
) {
  return callRepository
    .createQueryBuilder('call')
    .leftJoin('call.actor', 'actor')
    .addSelect(safeUserSelect('actor'))
    .leftJoin('call.application', 'application')
    .addSelect(['application.id', 'application.jobId', 'application.stage'])
    .leftJoin('application.job', 'job')
    .addSelect(['job.id', 'job.title', 'job.reference'])
    .where('call.organizationId = :organizationId', { organizationId });
}

export async function loadCall(
  callRepository: CandidateCallRepository,
  organizationId: string,
  callId: string,
) {
  const call = await buildCallQuery(callRepository, organizationId)
    .andWhere('call.id = :callId', { callId })
    .getOne();
  if (!call) throw new NotFoundException('Call not found');
  return call;
}
