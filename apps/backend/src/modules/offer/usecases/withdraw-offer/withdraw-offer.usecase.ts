import { Injectable } from '@nestjs/common';
import { ActivityRepository, OfferRepository } from '@db/repositories';
import { OfferStatus } from '@db/enums';
import {
  ACTIVE_OFFER_STATUSES,
  assertOfferStatus,
  loadOfferEntity,
  recordOfferActivity,
} from '../offer-query';
import { OfferActionCommand } from '../offer-action.command';
import { GetOffer } from '../get-offer/get-offer.usecase';

@Injectable()
export class WithdrawOffer {
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
    assertOfferStatus(
      offer,
      [...ACTIVE_OFFER_STATUSES, OfferStatus.REJECTED],
      'withdraw',
    );
    offer.status = OfferStatus.WITHDRAWN;
    offer.declineReason = command.reason?.trim() || null;
    const saved = await this.offerRepository.save(offer);

    await recordOfferActivity(this.activityRepository, {
      offer: saved,
      event: 'withdrawn',
      title: `Offer withdrawn: ${saved.title}`,
      body: saved.declineReason,
      actorId: command.userId,
    });

    return this.getOffer.execute(saved.id, command.organizationId);
  }
}
