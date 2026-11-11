import { ConflictException } from '@nestjs/common';
import { OfferEntity } from '@db/entities';
import { OfferStatus } from '@db/enums';
import { isOfferPastExpiry } from './offer-sign-view';

export function assertCanRespond(offer: OfferEntity): void {
  if (offer.status !== OfferStatus.SENT) {
    throw new ConflictException('This offer can no longer be signed');
  }
  if (isOfferPastExpiry(offer)) {
    throw new ConflictException('This offer has expired');
  }
}

export function responderId(offer: OfferEntity): string {
  return offer.createdBy ?? offer.id;
}
