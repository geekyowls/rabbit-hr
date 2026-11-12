import { NotFoundException } from '@nestjs/common';
import { OfferEntity } from '@db/entities';
import { OfferRepository, OrganizationRepository } from '@db/repositories';
import { OfferStatus, SalaryPeriod } from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { textToHtml } from '@modules/email-template/usecases/render-merge-fields';
import { offerSignStatus } from '../offer-signing';

const PERIOD_LABELS: Record<SalaryPeriod, string> = {
  [SalaryPeriod.YEAR]: 'per year',
  [SalaryPeriod.MONTH]: 'per month',
  [SalaryPeriod.DAY]: 'per day',
  [SalaryPeriod.HOUR]: 'per hour',
};

export async function loadSignableOffer(
  offerRepository: OfferRepository,
  token: string,
): Promise<OfferEntity> {
  const offer = token
    ? await offerRepository
        .createQueryBuilder('offer')
        .innerJoin('offer.candidate', 'candidate')
        .addSelect([
          'candidate.id',
          'candidate.firstName',
          'candidate.lastName',
        ])
        .innerJoin('offer.job', 'job')
        .addSelect([
          'job.id',
          'job.title',
          'job.reference',
          'job.location',
          'job.clientId',
        ])
        .leftJoin('job.client', 'client')
        .addSelect(['client.id', 'client.name'])
        .where('offer.signToken = :token', { token })
        .getOne()
    : null;
  if (
    !offer ||
    !offer.signTokenExpiresAt ||
    offer.signTokenExpiresAt < new Date()
  ) {
    throw new NotFoundException('This signing link is invalid or has expired');
  }
  return offer;
}

export function isOfferPastExpiry(offer: OfferEntity): boolean {
  return Boolean(
    offer.expiresAt &&
    new Date(`${offer.expiresAt}T23:59:59.999Z`) < new Date(),
  );
}

export async function buildSignView(
  offer: OfferEntity,
  organizationRepository: OrganizationRepository,
  atsSettingsService: AtsSettingsService,
) {
  const [organization, settings] = await Promise.all([
    organizationRepository.findOne({
      where: { id: offer.organizationId },
      select: ['id', 'name', 'logo', 'website'],
    }),
    atsSettingsService.get(offer.organizationId),
  ]);
  const salaryFormatted =
    offer.salaryAmount === null
      ? null
      : `${new Intl.NumberFormat(settings.locale, {
          style: 'currency',
          currency: offer.currency,
          maximumFractionDigits: 2,
        }).format(offer.salaryAmount)} ${PERIOD_LABELS[offer.salaryPeriod]}`;
  const letterBody = offer.sentLetterBody ?? offer.body ?? '';
  const canRespond =
    offer.status === OfferStatus.SENT && !isOfferPastExpiry(offer);
  return {
    status: offerSignStatus(offer),
    offerStatus: offer.status,
    canRespond,
    title: offer.title,
    salaryAmount: offer.salaryAmount,
    currency: offer.currency,
    salaryPeriod: offer.salaryPeriod,
    salaryFormatted,
    bonus: offer.bonus,
    equity: offer.equity,
    startDate: offer.startDate,
    offerExpiresAt: offer.expiresAt,
    linkExpiresAt: offer.signTokenExpiresAt,
    employmentType: offer.employmentType,
    location: offer.location ?? offer.job.location,
    letterBody,
    letterHtml: textToHtml(letterBody),
    candidate: {
      firstName: offer.candidate.firstName,
      lastName: offer.candidate.lastName,
    },
    job: {
      title: offer.job.title,
      reference: offer.job.reference,
      location: offer.job.location,
    },
    client: offer.job.client ? { name: offer.job.client.name } : null,
    company: {
      name: organization?.name ?? null,
      logo: organization?.logo ?? null,
      website: organization?.website ?? null,
    },
    locale: settings.locale,
    timezone: settings.timezone,
    sentAt: offer.sentAt,
    respondedAt: offer.respondedAt,
    signedAt: offer.signedAt,
    signedName: offer.signedName,
    declineReason:
      offer.status === OfferStatus.DECLINED ? offer.declineReason : null,
  };
}
