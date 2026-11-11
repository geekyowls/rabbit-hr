import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OfferEntity } from '@db/entities';
import { ActivityRepository, OfferRepository } from '@db/repositories';
import { OfferResponse, OfferStatus, PipelineStageCategory } from '@db/enums';
import { ApplicationStageMover } from '@shared/services/application-stage-mover.service';
import {
  assertOfferStatus,
  loadOfferEntity,
  recordOfferActivity,
} from '../offer-query';
import { GetOffer } from '../get-offer/get-offer.usecase';
import { RespondOfferCommand } from './respond-offer.command';

@Injectable()
export class RespondOffer {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly applicationStageMover: ApplicationStageMover,
    private readonly getOffer: GetOffer,
  ) {}

  async execute(command: RespondOfferCommand) {
    const { organizationId, userId } = command;
    const accepted = command.response === OfferResponse.ACCEPTED;
    const offer = await loadOfferEntity(
      this.offerRepository,
      command.offerId,
      organizationId,
    );
    assertOfferStatus(
      offer,
      [OfferStatus.SENT],
      accepted ? 'accept' : 'decline',
    );
    const reason = command.reason?.trim() || null;

    const saved = await this.dataSource.transaction(async (manager) => {
      offer.status = accepted ? OfferStatus.ACCEPTED : OfferStatus.DECLINED;
      offer.respondedAt = new Date();
      offer.declineReason = accepted ? null : reason;
      const result = await manager.getRepository(OfferEntity).save(offer);
      await recordOfferActivity(
        this.activityRepository,
        {
          offer: result,
          event: result.status,
          title: accepted
            ? `Offer accepted: ${result.title}`
            : `Offer declined: ${result.title}`,
          body: reason,
          actorId: userId,
        },
        manager,
      );
      if (accepted) {
        await this.applicationStageMover.moveToCategory(manager, {
          organizationId,
          applicationId: offer.applicationId,
          category: PipelineStageCategory.HIRED,
          onlyFrom: [
            PipelineStageCategory.APPLIED,
            PipelineStageCategory.SCREENING,
            PipelineStageCategory.INTERVIEW,
            PipelineStageCategory.OFFER,
          ],
          actorId: userId,
        });
      }
      return result;
    });

    return this.getOffer.execute(saved.id, organizationId);
  }
}
