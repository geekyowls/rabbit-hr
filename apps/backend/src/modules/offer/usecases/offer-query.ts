import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { OfferEntity } from '@db/entities';
import {
  ActivityRepository,
  OfferRepository,
  UserRepository,
} from '@db/repositories';
import { ActivityType, OfferStatus } from '@db/enums';
import { safeUserSelect } from '@shared/helpers/safe-user-select';

type UserSummary = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export const ACTIVE_OFFER_STATUSES: OfferStatus[] = [
  OfferStatus.DRAFT,
  OfferStatus.PENDING_APPROVAL,
  OfferStatus.APPROVED,
  OfferStatus.SENT,
];

export const OFFER_SEARCH_CLAUSE = `(candidate.firstName ILIKE :search OR candidate.lastName ILIKE :search OR CONCAT(candidate.firstName, ' ', candidate.lastName) ILIKE :search OR candidate.email ILIKE :search OR job.title ILIKE :search OR job.reference ILIKE :search OR offer.title ILIKE :search)`;

export function buildOfferQuery(
  offerRepository: OfferRepository,
  organizationId: string,
) {
  return offerRepository
    .createQueryBuilder('offer')
    .innerJoin('offer.candidate', 'candidate')
    .addSelect([
      'candidate.id',
      'candidate.firstName',
      'candidate.lastName',
      'candidate.email',
    ])
    .innerJoin('offer.job', 'job')
    .addSelect([
      'job.id',
      'job.title',
      'job.reference',
      'job.department',
      'job.clientId',
    ])
    .leftJoin('job.client', 'client')
    .addSelect(['client.id', 'client.name'])
    .innerJoin('offer.application', 'application')
    .addSelect(['application.id', 'application.stage'])
    .leftJoin('offer.creator', 'creator')
    .addSelect(safeUserSelect('creator'))
    .where('offer.organizationId = :organizationId', { organizationId });
}

export async function hydrateOffers(
  userRepository: UserRepository,
  organizationId: string,
  offers: OfferEntity[],
) {
  const userIds = [...new Set(offers.flatMap((o) => o.approverIds))];
  const users: UserSummary[] =
    userIds.length > 0
      ? await userRepository.find({
          where: { id: In(userIds), organizationId },
          select: ['id', 'firstName', 'lastName', 'email'],
        })
      : [];
  const userById = new Map(users.map((u) => [u.id, u]));
  return offers.map((offer) => {
    const { candidate, job, application, creator, ...rest } = offer;
    return {
      ...rest,
      candidate,
      job,
      client: job.client ?? null,
      application,
      creator: creator ?? null,
      approvers: offer.approverIds
        .map((id) => {
          const user = userById.get(id);
          if (!user) return null;
          const approval = offer.approvals.find((a) => a.userId === id);
          return {
            ...user,
            decision: approval?.decision ?? null,
            comment: approval?.comment ?? null,
            decidedAt: approval?.decidedAt ?? null,
          };
        })
        .filter((a) => a !== null),
    };
  });
}

export async function loadOfferDetail(
  offerRepository: OfferRepository,
  userRepository: UserRepository,
  offerId: string,
  organizationId: string,
) {
  const offer = await buildOfferQuery(offerRepository, organizationId)
    .andWhere('offer.id = :offerId', { offerId })
    .getOne();
  if (!offer) {
    throw new NotFoundException('Offer not found');
  }
  const [hydrated] = await hydrateOffers(userRepository, organizationId, [
    offer,
  ]);
  return hydrated;
}

export async function loadOfferEntity(
  offerRepository: OfferRepository,
  offerId: string,
  organizationId: string,
): Promise<OfferEntity> {
  const offer = await offerRepository.findOne({
    where: { id: offerId, organizationId },
    relations: { job: true },
  });
  if (!offer) {
    throw new NotFoundException('Offer not found');
  }
  return offer;
}

const STATUS_LABELS: Record<OfferStatus, string> = {
  [OfferStatus.DRAFT]: 'draft',
  [OfferStatus.PENDING_APPROVAL]: 'pending approval',
  [OfferStatus.APPROVED]: 'approved',
  [OfferStatus.REJECTED]: 'rejected',
  [OfferStatus.SENT]: 'sent',
  [OfferStatus.ACCEPTED]: 'accepted',
  [OfferStatus.DECLINED]: 'declined',
  [OfferStatus.WITHDRAWN]: 'withdrawn',
  [OfferStatus.EXPIRED]: 'expired',
};

export function assertOfferStatus(
  offer: OfferEntity,
  allowed: OfferStatus[],
  action: string,
): void {
  if (allowed.includes(offer.status)) return;
  const expected = allowed.map((s) => STATUS_LABELS[s]).join(' or ');
  throw new BadRequestException(
    `Cannot ${action} an offer that is ${STATUS_LABELS[offer.status]}, it must be ${expected}`,
  );
}

export async function assertApprovers(
  userRepository: UserRepository,
  organizationId: string,
  approverIds: string[],
): Promise<void> {
  if (approverIds.length === 0) return;
  const count = await userRepository.count({
    where: { id: In(approverIds), organizationId },
  });
  if (count !== new Set(approverIds).size) {
    throw new BadRequestException(
      'One or more approvers are not members of this organization',
    );
  }
}

export interface OfferActivityInput {
  offer: OfferEntity;
  event: string;
  title: string;
  actorId: string;
  body?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordOfferActivity(
  activityRepository: ActivityRepository,
  input: OfferActivityInput,
  manager?: EntityManager,
): Promise<void> {
  const { offer } = input;
  await activityRepository.record(
    {
      organizationId: offer.organizationId,
      candidateId: offer.candidateId,
      applicationId: offer.applicationId,
      jobId: offer.jobId,
      clientId: offer.job?.clientId ?? null,
      type: ActivityType.OFFER,
      title: input.title,
      body: input.body ?? null,
      metadata: {
        kind: 'offer',
        event: input.event,
        offerId: offer.id,
        offerTitle: offer.title,
        status: offer.status,
        ...input.metadata,
      },
      actorId: input.actorId,
    },
    manager,
  );
}
