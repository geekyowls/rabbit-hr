import { Injectable } from '@nestjs/common';
import { OfferRepository, OrganizationRepository } from '@db/repositories';
import { OfferResponse } from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { RespondOffer } from '../respond-offer/respond-offer.usecase';
import { RespondOfferCommand } from '../respond-offer/respond-offer.command';
import { buildSignView, loadSignableOffer } from './offer-sign-view';
import { assertCanRespond, responderId } from './respond-offer-signing';
import { DeclineOfferSigningCommand } from './public-sign.command';

@Injectable()
export class DeclineOfferSigning {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly atsSettingsService: AtsSettingsService,
    private readonly respondOffer: RespondOffer,
  ) {}

  async execute(command: DeclineOfferSigningCommand) {
    const offer = await loadSignableOffer(this.offerRepository, command.token);
    assertCanRespond(offer);

    await this.respondOffer.execute(
      RespondOfferCommand.create({
        userId: responderId(offer),
        organizationId: offer.organizationId,
        offerId: offer.id,
        response: OfferResponse.DECLINED,
        reason: command.reason?.trim() || undefined,
      }),
      { channel: 'e_sign' },
    );

    const updated = await loadSignableOffer(
      this.offerRepository,
      command.token,
    );
    return buildSignView(
      updated,
      this.organizationRepository,
      this.atsSettingsService,
    );
  }
}
