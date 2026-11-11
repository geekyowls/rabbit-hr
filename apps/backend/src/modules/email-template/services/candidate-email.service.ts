import { Injectable, NotFoundException } from '@nestjs/common';
import { MailService } from '@boilerplate/core';
import { EmailTemplateEntity } from '@db/entities';
import {
  ActivityRepository,
  ApplicationRepository,
  EmailTemplateRepository,
  OrganizationRepository,
  UserRepository,
} from '@db/repositories';
import { ActivityType, EmailTemplateCategory } from '@db/enums';
import { ContextLogger } from '@shared/framework/context-logger';
import {
  MergeFieldValues,
  renderMergeFields,
  textToHtml,
} from '../usecases/render-merge-fields';

export interface ApplicationMergeContext {
  applicationId: string;
  candidateId: string;
  candidateEmail: string;
  jobId: string;
  clientId: string | null;
  recruiterEmail: string | null;
  values: MergeFieldValues;
}

export interface CandidateEmailInput {
  organizationId: string;
  userId: string;
  context: ApplicationMergeContext;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface CandidateEmailResult {
  sent: boolean;
  reason: string | null;
  to: string;
  subject: string;
  body: string;
  activityId: string;
}

@Injectable()
export class CandidateEmailService {
  private readonly logger = new ContextLogger(CandidateEmailService.name);

  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly emailTemplateRepository: EmailTemplateRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async loadContext(
    applicationId: string,
    organizationId: string,
    userId: string,
  ): Promise<ApplicationMergeContext> {
    const application = await this.applicationRepository
      .createQueryBuilder('application')
      .innerJoin('application.candidate', 'candidate')
      .addSelect([
        'candidate.id',
        'candidate.firstName',
        'candidate.lastName',
        'candidate.email',
      ])
      .innerJoin('application.job', 'job')
      .addSelect([
        'job.id',
        'job.title',
        'job.reference',
        'job.location',
        'job.clientId',
      ])
      .leftJoin('job.client', 'client')
      .addSelect(['client.id', 'client.name'])
      .where('application.id = :id', { id: applicationId })
      .andWhere('application.organizationId = :organizationId', {
        organizationId,
      })
      .getOne();
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const [recruiter, organization] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId, organizationId },
        select: ['id', 'firstName', 'lastName', 'email'],
      }),
      this.organizationRepository.findOne({
        where: { id: organizationId },
        select: ['id', 'name'],
      }),
    ]);

    const { candidate, job } = application;
    const recruiterName = [recruiter?.firstName, recruiter?.lastName]
      .filter(Boolean)
      .join(' ');
    return {
      applicationId: application.id,
      candidateId: candidate.id,
      candidateEmail: candidate.email,
      jobId: job.id,
      clientId: job.clientId,
      recruiterEmail: recruiter?.email ?? null,
      values: {
        'candidate.firstName': candidate.firstName,
        'candidate.lastName': candidate.lastName,
        'candidate.fullName': `${candidate.firstName} ${candidate.lastName}`,
        'candidate.email': candidate.email,
        'job.title': job.title,
        'job.reference': job.reference,
        'job.location': job.location,
        'client.name': job.client?.name,
        'recruiter.name': recruiterName || recruiter?.email,
        'recruiter.firstName': recruiter?.firstName,
        'recruiter.email': recruiter?.email,
        'organization.name': organization?.name,
      },
    };
  }

  async findTemplate(
    organizationId: string,
    category: EmailTemplateCategory,
  ): Promise<EmailTemplateEntity | null> {
    return this.emailTemplateRepository.findOne({
      where: { organizationId, category },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  render(template: string, values: MergeFieldValues): string {
    return renderMergeFields(template, values);
  }

  async send(input: CandidateEmailInput): Promise<CandidateEmailResult> {
    const { context, organizationId } = input;
    const subject = renderMergeFields(input.subject, context.values);
    const body = renderMergeFields(input.body, context.values);

    let sent = false;
    let reason: string | null = null;
    try {
      await this.mailService.sendEmail({
        to: context.candidateEmail,
        subject,
        text: body,
        html: textToHtml(body),
        ...(context.recruiterEmail && { replyTo: context.recruiterEmail }),
      });
      sent = true;
    } catch (error) {
      reason =
        error instanceof Error ? error.message : 'Mail is not configured';
      this.logger.warn(`Candidate email not sent: ${reason}`);
    }

    const activity = await this.activityRepository.record({
      organizationId,
      candidateId: context.candidateId,
      applicationId: context.applicationId,
      jobId: context.jobId,
      clientId: context.clientId,
      type: ActivityType.EMAIL,
      title: `Email: ${subject}`,
      body,
      metadata: {
        to: context.candidateEmail,
        subject,
        sent,
        reason,
        ...input.metadata,
      },
      actorId: input.userId,
    });

    return {
      sent,
      reason,
      to: context.candidateEmail,
      subject,
      body,
      activityId: activity.id,
    };
  }

  sendInBackground(input: CandidateEmailInput): void {
    this.send(input).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Candidate email failed: ${message}`);
    });
  }
}
