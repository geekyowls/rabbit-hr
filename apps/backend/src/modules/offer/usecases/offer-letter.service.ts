import { Injectable } from '@nestjs/common';
import { OfferEntity } from '@db/entities';
import { EmailTemplateCategory, SalaryPeriod } from '@db/enums';
import { ContextLogger } from '@shared/framework/context-logger';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import {
  ApplicationMergeContext,
  CandidateEmailService,
} from '@modules/email-template/services/candidate-email.service';

const PERIOD_LABELS: Record<SalaryPeriod, string> = {
  [SalaryPeriod.YEAR]: 'per year',
  [SalaryPeriod.MONTH]: 'per month',
  [SalaryPeriod.DAY]: 'per day',
  [SalaryPeriod.HOUR]: 'per hour',
};

const FALLBACK_SUBJECT = 'Your offer for {{job.title}}';
const FALLBACK_BODY =
  'Hi {{candidate.firstName}},\n\nWe are delighted to offer you the {{offer.title}} role.\n\nKind regards,\n{{recruiter.name}}\n{{organization.name}}';

const OFFER_DETAILS = [
  'Offer summary',
  'Role: {{offer.title}}',
  'Salary: {{offer.salary}}',
  'Start date: {{offer.startDate}}',
  'Please respond by: {{offer.expiresAt}}',
].join('\n');

type OfferFields = Pick<
  OfferEntity,
  | 'applicationId'
  | 'organizationId'
  | 'title'
  | 'salaryAmount'
  | 'currency'
  | 'salaryPeriod'
  | 'startDate'
  | 'expiresAt'
  | 'bonus'
  | 'location'
>;

@Injectable()
export class OfferLetterService {
  private readonly logger = new ContextLogger(OfferLetterService.name);

  constructor(
    private readonly candidateEmailService: CandidateEmailService,
    private readonly atsSettingsService: AtsSettingsService,
  ) {}

  private async buildContext(
    offer: OfferFields,
    userId: string,
  ): Promise<ApplicationMergeContext> {
    const [context, settings] = await Promise.all([
      this.candidateEmailService.loadContext(
        offer.applicationId,
        offer.organizationId,
        userId,
      ),
      this.atsSettingsService.get(offer.organizationId),
    ]);
    const formatDate = (value: string | null) =>
      value
        ? new Intl.DateTimeFormat(settings.locale, {
            dateStyle: 'long',
            timeZone: 'UTC',
          }).format(new Date(`${value}T00:00:00Z`))
        : 'To be confirmed';
    const salary =
      offer.salaryAmount === null
        ? 'To be confirmed'
        : `${new Intl.NumberFormat(settings.locale, {
            style: 'currency',
            currency: offer.currency,
            maximumFractionDigits: 2,
          }).format(offer.salaryAmount)} ${PERIOD_LABELS[offer.salaryPeriod]}`;
    context.values = {
      ...context.values,
      'offer.title': offer.title,
      'offer.salary': salary,
      'offer.startDate': formatDate(offer.startDate),
      'offer.expiresAt': formatDate(offer.expiresAt),
      'offer.bonus': offer.bonus,
      'offer.location': offer.location,
    };
    return context;
  }

  async renderDefaultBody(offer: OfferFields, userId: string): Promise<string> {
    const [context, template] = await Promise.all([
      this.buildContext(offer, userId),
      this.candidateEmailService.findTemplate(
        offer.organizationId,
        EmailTemplateCategory.OFFER,
      ),
    ]);
    const templateBody = template?.body ?? FALLBACK_BODY;
    const body = templateBody.includes('{{offer.')
      ? templateBody
      : `${templateBody}\n\n${OFFER_DETAILS}`;
    return this.candidateEmailService.render(body, context.values);
  }

  sendInBackground(offer: OfferEntity, userId: string): void {
    this.send(offer, userId).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Offer email not sent: ${message}`);
    });
  }

  private async send(offer: OfferEntity, userId: string): Promise<void> {
    const [context, template] = await Promise.all([
      this.buildContext(offer, userId),
      this.candidateEmailService.findTemplate(
        offer.organizationId,
        EmailTemplateCategory.OFFER,
      ),
    ]);
    const body = offer.body ?? (await this.renderDefaultBody(offer, userId));
    await this.candidateEmailService.send({
      organizationId: offer.organizationId,
      userId,
      context,
      subject: template?.subject ?? FALLBACK_SUBJECT,
      body,
      metadata: { templateId: template?.id ?? null, offerId: offer.id },
    });
  }
}
