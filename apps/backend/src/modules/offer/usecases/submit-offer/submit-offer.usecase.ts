import { Injectable } from '@nestjs/common';
import { ActivityRepository, OfferRepository } from '@db/repositories';
import { OfferStatus } from '@db/enums';
import {
  assertOfferStatus,
  loadOfferEntity,
  recordOfferActivity,
} from '../offer-query';
import { OfferActionCommand } from '../offer-action.command';
import { GetOffer } from '../get-offer/get-offer.usecase';

@Injectable()
export class SubmitOffer {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly getOffer: GetOffer,
  ) {}

  async execute(command: OfferActionCommand) {
    const offer = await loadOfferEntity(
      this.offerRepository,
      command.offerId,
      command.organizationId,
    );
    assertOfferStatus(offer, [OfferStatus.DRAFT], 'submit');
    const needsApproval = offer.approverIds.length > 0;
    offer.status = needsApproval
      ? OfferStatus.PENDING_APPROVAL
      : OfferStatus.APPROVED;
    offer.approvals = [];
    const saved = await this.offerRepository.save(offer);

    await recordOfferActivity(this.activityRepository, {
      offer: saved,
      event: needsApproval ? 'submitted' : 'approved',
      title: needsApproval
        ? `Offer submitted for approval: ${saved.title}`
        : `Offer approved without approvers: ${saved.title}`,
      actorId: command.userId,
    });

    return this.getOffer.execute(saved.id, command.organizationId);
  }
}
