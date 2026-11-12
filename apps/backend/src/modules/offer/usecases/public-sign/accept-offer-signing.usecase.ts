import { BadRequestException, Injectable } from '@nestjs/common';
import { OfferRepository, OrganizationRepository } from '@db/repositories';
import { OfferResponse } from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { RespondOffer } from '../respond-offer/respond-offer.usecase';
import { RespondOfferCommand } from '../respond-offer/respond-offer.command';
import { hashLetter, nameMatches } from '../offer-signing';
import { buildSignView, loadSignableOffer } from './offer-sign-view';
import { assertCanRespond, responderId } from './respond-offer-signing';
import { AcceptOfferSigningCommand } from './public-sign.command';

@Injectable()
export class AcceptOfferSigning {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly atsSettingsService: AtsSettingsService,
    private readonly respondOffer: RespondOffer,
  ) {}

  async execute(command: AcceptOfferSigningCommand) {
    const offer = await loadSignableOffer(this.offerRepository, command.token);
    assertCanRespond(offer);
    const signedName = command.fullName.trim().replace(/\s+/g, ' ');
    if (
      !nameMatches(
        signedName,
        offer.candidate.firstName,
        offer.candidate.lastName,
      )
    ) {
      throw new BadRequestException(
        'Type your full name exactly as it appears on the offer',
      );
    }

    await this.respondOffer.execute(
      RespondOfferCommand.create({
        userId: responderId(offer),
        organizationId: offer.organizationId,
        offerId: offer.id,
        response: OfferResponse.ACCEPTED,
      }),
      {
        channel: 'e_sign',
        signature: {
          signedName,
          signedIp: command.ip?.slice(0, 64) ?? null,
          signedUserAgent: command.userAgent?.slice(0, 500) ?? null,
          signatureHash: hashLetter(offer.sentLetterBody ?? offer.body ?? ''),
        },
      },
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
