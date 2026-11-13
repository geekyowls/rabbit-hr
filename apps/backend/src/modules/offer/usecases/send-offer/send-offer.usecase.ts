import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { PlanFeature } from '@boilerplate/core';
import { BillingEntitlementsService } from '@modules/billing/core/billing-entitlements.service';
import { OfferEntity } from '@db/entities';
import { ActivityRepository, OfferRepository } from '@db/repositories';
import { OfferStatus, PipelineStageCategory } from '@db/enums';
import { ApplicationStageMover } from '@shared/services/application-stage-mover.service';
import {
  assertOfferStatus,
  loadOfferEntity,
  recordOfferActivity,
} from '../offer-query';
import { OfferActionCommand } from '../offer-action.command';
import { OfferLetterService } from '../offer-letter.service';
import { GetOffer } from '../get-offer/get-offer.usecase';
import { generateSignToken, signTokenExpiry, signUrl } from '../offer-signing';

@Injectable()
export class SendOffer {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly applicationStageMover: ApplicationStageMover,
    private readonly offerLetterService: OfferLetterService,
    private readonly getOffer: GetOffer,
    private readonly config: ConfigService,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  async execute(command: OfferActionCommand) {
    const { organizationId, userId } = command;
    const offer = await loadOfferEntity(
      this.offerRepository,
      command.offerId,
      organizationId,
    );
    assertOfferStatus(offer, [OfferStatus.APPROVED], 'send');
    const sentAt = new Date();
    const eSign = await this.entitlements.hasFeature(
      organizationId,
      PlanFeature.OFFER_ESIGN,
    );
    const token = eSign ? generateSignToken() : null;
    const letter = await this.offerLetterService.renderLetter(offer, userId);

    const saved = await this.dataSource.transaction(async (manager) => {
      offer.status = OfferStatus.SENT;
      offer.sentAt = sentAt;
      offer.signToken = token;
      offer.signTokenExpiresAt = token ? signTokenExpiry(offer, sentAt) : null;
      offer.sentLetterBody = letter;
      offer.signedAt = null;
      offer.signedName = null;
      offer.signedIp = null;
      offer.signedUserAgent = null;
      offer.signatureHash = null;
      const result = await manager.getRepository(OfferEntity).save(offer);
      await recordOfferActivity(
        this.activityRepository,
        {
          offer: result,
          event: 'sent',
          title: `Offer sent to candidate: ${result.title}`,
          actorId: userId,
        },
        manager,
      );
      await this.applicationStageMover.moveToCategory(manager, {
        organizationId,
        applicationId: offer.applicationId,
        category: PipelineStageCategory.OFFER,
        onlyFrom: [
          PipelineStageCategory.APPLIED,
          PipelineStageCategory.SCREENING,
          PipelineStageCategory.INTERVIEW,
        ],
        actorId: userId,
      });
      return result;
    });

    this.offerLetterService.sendInBackground(
      saved,
      userId,
      token ? signUrl(this.config, token) : null,
    );
    return this.getOffer.execute(saved.id, organizationId);
  }
}
