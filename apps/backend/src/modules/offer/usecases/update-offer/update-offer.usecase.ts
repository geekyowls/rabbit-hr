import { Injectable } from '@nestjs/common';
import {
  ActivityRepository,
  OfferRepository,
  UserRepository,
} from '@db/repositories';
import { OfferStatus } from '@db/enums';
import { pickDefined } from '@shared/helpers/pick-defined';
import {
  assertApprovers,
  assertOfferStatus,
  loadOfferEntity,
  recordOfferActivity,
} from '../offer-query';
import { GetOffer } from '../get-offer/get-offer.usecase';
import { UpdateOfferCommand } from './update-offer.command';

@Injectable()
export class UpdateOffer {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly userRepository: UserRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly getOffer: GetOffer,
  ) {}

  async execute(command: UpdateOfferCommand) {
    const { organizationId, userId } = command;
    const offer = await loadOfferEntity(
      this.offerRepository,
      command.offerId,
      organizationId,
    );
    assertOfferStatus(offer, [OfferStatus.DRAFT, OfferStatus.REJECTED], 'edit');
    const changes = pickDefined(command.payload);
    if (changes.approverIds) {
      await assertApprovers(
        this.userRepository,
        organizationId,
        changes.approverIds,
      );
    }
    const reopened = offer.status === OfferStatus.REJECTED;
    Object.assign(offer, changes, {
      status: OfferStatus.DRAFT,
      approvals: reopened ? [] : offer.approvals,
    });
    const saved = await this.offerRepository.save(offer);

    await recordOfferActivity(this.activityRepository, {
      offer: saved,
      event: reopened ? 'revised' : 'updated',
      title: reopened
        ? `Offer revised after rejection: ${saved.title}`
        : `Offer updated: ${saved.title}`,
      actorId: userId,
    });

    return this.getOffer.execute(saved.id, organizationId);
  }
}
