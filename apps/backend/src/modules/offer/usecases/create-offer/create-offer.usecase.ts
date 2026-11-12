import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import {
  ActivityRepository,
  ApplicationRepository,
  OfferRepository,
  UserRepository,
} from '@db/repositories';
import { OfferStatus } from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import {
  ACTIVE_OFFER_STATUSES,
  assertApprovers,
  recordOfferActivity,
} from '../offer-query';
import { OfferLetterService } from '../offer-letter.service';
import { GetOffer } from '../get-offer/get-offer.usecase';
import { CreateOfferCommand } from './create-offer.command';

@Injectable()
export class CreateOffer {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly userRepository: UserRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly atsSettingsService: AtsSettingsService,
    private readonly offerLetterService: OfferLetterService,
    private readonly getOffer: GetOffer,
  ) {}

  async execute(command: CreateOfferCommand) {
    const { organizationId, userId, payload } = command;
    const application = await this.applicationRepository.findOne({
      where: { id: payload.applicationId, organizationId },
      relations: { job: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    const active = await this.offerRepository.exists({
      where: {
        organizationId,
        applicationId: application.id,
        status: In(ACTIVE_OFFER_STATUSES),
      },
    });
    if (active) {
      throw new BadRequestException(
        'This application already has an open offer, withdraw it before creating another',
      );
    }
    const approverIds = payload.approverIds ?? [];
    await assertApprovers(this.userRepository, organizationId, approverIds);
    const settings = await this.atsSettingsService.get(organizationId);
    const { job } = application;

    const offer = this.offerRepository.create({
      organizationId,
      applicationId: application.id,
      candidateId: application.candidateId,
      jobId: application.jobId,
      status: OfferStatus.DRAFT,
      title: payload.title ?? job.title,
      salaryAmount: payload.salaryAmount ?? null,
      currency: payload.currency ?? settings.defaultCurrency,
      salaryPeriod: payload.salaryPeriod ?? settings.salaryPeriodDefault,
      bonus: payload.bonus ?? null,
      equity: payload.equity ?? null,
      startDate: payload.startDate ?? null,
      expiresAt: payload.expiresAt ?? null,
      employmentType: payload.employmentType ?? job.employmentType,
      location: payload.location ?? job.location,
      approverIds,
      approvals: [],
      createdBy: userId,
    });
    offer.body =
      payload.body ??
      (await this.offerLetterService.renderDefaultBody(offer, userId));
    const saved = await this.offerRepository.save(offer);
    saved.job = job;

    await recordOfferActivity(this.activityRepository, {
      offer: saved,
      event: 'created',
      title: `Offer drafted: ${saved.title}`,
      actorId: userId,
    });

    return this.getOffer.execute(saved.id, organizationId);
  }
}
