import { Injectable } from '@nestjs/common';
import { InterviewEntity } from '@db/entities';
import { EmailTemplateCategory, InterviewType } from '@db/enums';
import { ContextLogger } from '@shared/framework/context-logger';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { CandidateEmailService } from '@modules/email-template/services/candidate-email.service';

const TYPE_LABELS: Record<InterviewType, string> = {
  [InterviewType.PHONE]: 'Phone',
  [InterviewType.VIDEO]: 'Video',
  [InterviewType.ONSITE]: 'Onsite',
  [InterviewType.TECHNICAL]: 'Technical',
  [InterviewType.PANEL]: 'Panel',
  [InterviewType.ASSESSMENT]: 'Assessment',
  [InterviewType.OTHER]: 'Other',
};

export function interviewTypeLabel(type: InterviewType): string {
  return TYPE_LABELS[type];
}

const FALLBACK_SUBJECT = 'Interview invitation: {{job.title}}';
const FALLBACK_BODY =
  'Hi {{candidate.firstName}},\n\nYou are invited to interview for the {{job.title}} role.\n\nKind regards,\n{{recruiter.name}}\n{{organization.name}}';

@Injectable()
export class InterviewInviteService {
  private readonly logger = new ContextLogger(InterviewInviteService.name);

  constructor(
    private readonly candidateEmailService: CandidateEmailService,
    private readonly atsSettingsService: AtsSettingsService,
  ) {}

  async notify(
    interview: InterviewEntity,
    userId: string,
    rescheduled: boolean,
  ): Promise<void> {
    const { organizationId } = interview;
    const [context, template, settings] = await Promise.all([
      this.candidateEmailService.loadContext(
        interview.applicationId,
        organizationId,
        userId,
      ),
      this.candidateEmailService.findTemplate(
        organizationId,
        EmailTemplateCategory.INTERVIEW,
      ),
      this.atsSettingsService.get(organizationId),
    ]);

    const when = new Intl.DateTimeFormat(settings.locale, {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: interview.timezone,
    }).format(new Date(interview.scheduledAt));
    context.values = {
      ...context.values,
      'interview.title': interview.title,
      'interview.type': interviewTypeLabel(interview.type),
      'interview.dateTime': `${when} (${interview.timezone})`,
      'interview.duration': `${interview.durationMinutes} minutes`,
      'interview.location': interview.location,
      'interview.meetingUrl': interview.meetingUrl,
    };

    const templateBody = template?.body ?? FALLBACK_BODY;
    const details = [
      rescheduled ? 'Your interview has been rescheduled.' : null,
      'Interview details',
      `When: {{interview.dateTime}}`,
      `Duration: {{interview.duration}}`,
      `Format: {{interview.type}}`,
      interview.location ? `Location: {{interview.location}}` : null,
      interview.meetingUrl ? `Join link: {{interview.meetingUrl}}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    const body = templateBody.includes('{{interview.')
      ? templateBody
      : `${templateBody}\n\n${details}`;

    this.candidateEmailService.sendInBackground({
      organizationId,
      userId,
      context,
      subject: template?.subject ?? FALLBACK_SUBJECT,
      body,
      metadata: {
        templateId: template?.id ?? null,
        interviewId: interview.id,
      },
    });
  }

  notifyInBackground(
    interview: InterviewEntity,
    userId: string,
    rescheduled = false,
  ): void {
    this.notify(interview, userId, rescheduled).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Interview invite not sent: ${message}`);
    });
  }
}
