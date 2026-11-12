import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ActivityRepository, OfferRepository } from '@db/repositories';
import { OfferDecision, OfferStatus } from '@db/enums';
import {
  assertOfferStatus,
  loadOfferEntity,
  recordOfferActivity,
} from '../offer-query';
import { GetOffer } from '../get-offer/get-offer.usecase';
import { DecideOfferCommand } from './decide-offer.command';

@Injectable()
export class DecideOffer {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly getOffer: GetOffer,
  ) {}

  async execute(command: DecideOfferCommand) {
    const { userId, decision } = command;
    const approving = decision === OfferDecision.APPROVED;
    const offer = await loadOfferEntity(
      this.offerRepository,
      command.offerId,
      command.organizationId,
    );
    assertOfferStatus(
      offer,
      [OfferStatus.PENDING_APPROVAL],
      approving ? 'approve' : 'reject',
    );
    if (!offer.approverIds.includes(userId)) {
      throw new ForbiddenException(
        'Only approvers listed on this offer can approve or reject it',
      );
    }
    if (offer.approvals.some((a) => a.userId === userId)) {
      throw new BadRequestException(
        'You have already recorded a decision on this offer',
      );
    }

    offer.approvals = [
      ...offer.approvals,
      {
        userId,
        decision,
        comment: command.reason?.trim() || null,
        decidedAt: new Date().toISOString(),
      },
    ];
    const approvedBy = new Set(
      offer.approvals
        .filter((a) => a.decision === OfferDecision.APPROVED)
        .map((a) => a.userId),
    );
    if (!approving) {
      offer.status = OfferStatus.REJECTED;
    } else if (offer.approverIds.every((id) => approvedBy.has(id))) {
      offer.status = OfferStatus.APPROVED;
    }
    const saved = await this.offerRepository.save(offer);

    const titles: Partial<Record<OfferStatus, string>> = {
      [OfferStatus.REJECTED]: 'Offer rejected by approver',
      [OfferStatus.APPROVED]: 'Offer fully approved',
      [OfferStatus.PENDING_APPROVAL]: 'Offer approved by approver',
    };
    await recordOfferActivity(this.activityRepository, {
      offer: saved,
      event: approving ? 'approval_granted' : 'approval_rejected',
      title: `${titles[saved.status]}: ${saved.title}`,
      body: command.reason ?? null,
      actorId: userId,
      metadata: {
        approvals: saved.approvals.length,
        approvers: saved.approverIds.length,
      },
    });

    return this.getOffer.execute(saved.id, command.organizationId);
  }
}
