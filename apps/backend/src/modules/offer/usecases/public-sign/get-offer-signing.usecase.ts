import { Injectable } from '@nestjs/common';
import { OfferRepository, OrganizationRepository } from '@db/repositories';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { buildSignView, loadSignableOffer } from './offer-sign-view';
import { PublicOfferSignCommand } from './public-sign.command';

@Injectable()
export class GetOfferSigning {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly atsSettingsService: AtsSettingsService,
  ) {}

  async execute(command: PublicOfferSignCommand) {
    const offer = await loadSignableOffer(this.offerRepository, command.token);
    return buildSignView(
      offer,
      this.organizationRepository,
      this.atsSettingsService,
    );
  }
}
