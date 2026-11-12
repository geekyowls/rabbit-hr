import { Injectable } from '@nestjs/common';
import { OfferRepository } from '@db/repositories';
import { listPortalOffers } from '../portal-query';
import { PortalCandidateCommand } from '../portal-candidate.command';

@Injectable()
export class ListPortalOffers {
  constructor(private readonly offerRepository: OfferRepository) {}

  async execute(command: PortalCandidateCommand) {
    return listPortalOffers(this.offerRepository, {
      candidateId: command.candidateId,
      organizationId: command.organizationId,
    });
  }
}
