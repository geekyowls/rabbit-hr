import { Injectable } from '@nestjs/common';
import { ActivityRepository, OfferRepository } from '@db/repositories';
import { OfferStatus } from '@db/enums';
import {
  assertOfferStatus,
  loadOfferEntity,
  recordOfferActivity,
} from '../offer-query';
import { OfferActionCommand } from '../offer-action.command';

const DELETABLE_STATUSES = [
  OfferStatus.DRAFT,
  OfferStatus.REJECTED,
  OfferStatus.WITHDRAWN,
  OfferStatus.EXPIRED,
];

@Injectable()
export class DeleteOffer {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(command: OfferActionCommand) {
    const offer = await loadOfferEntity(
      this.offerRepository,
      command.offerId,
      command.organizationId,
    );
    assertOfferStatus(offer, DELETABLE_STATUSES, 'delete');
    await this.offerRepository.delete({
      id: offer.id,
      organizationId: command.organizationId,
    });
    await recordOfferActivity(this.activityRepository, {
      offer,
      event: 'deleted',
      title: `Offer deleted: ${offer.title}`,
      actorId: command.userId,
    });
    return { success: true };
  }
}
