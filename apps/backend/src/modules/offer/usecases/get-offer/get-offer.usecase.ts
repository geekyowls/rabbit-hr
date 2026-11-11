import { Injectable } from '@nestjs/common';
import { OfferRepository, UserRepository } from '@db/repositories';
import { loadOfferDetail } from '../offer-query';

@Injectable()
export class GetOffer {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(offerId: string, organizationId: string) {
    return loadOfferDetail(
      this.offerRepository,
      this.userRepository,
      offerId,
      organizationId,
    );
  }
}
