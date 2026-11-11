import { Injectable, NotFoundException } from '@nestjs/common';
import { MailService } from '@boilerplate/core';
import {
  ActivityRepository,
  ApplicationRepository,
  EmailTemplateRepository,
  OrganizationRepository,
  UserRepository,
} from '@db/repositories';
import { ActivityType } from '@db/enums';
import { ContextLogger } from '@shared/framework/context-logger';
import { renderMergeFields, textToHtml } from '../render-merge-fields';
import { SendApplicationEmailCommand } from './send-application-email.command';

@Injectable()
export class SendApplicationEmail {
  private readonly logger = new ContextLogger(SendApplicationEmail.name);

  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly emailTemplateRepository: EmailTemplateRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async execute(command: SendApplicationEmailCommand) {
    const { organizationId } = command;
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
      .where('application.id = :id', { id: command.applicationId })
      .andWhere('application.organizationId = :organizationId', {
        organizationId,
      })
      .getOne();
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const template = command.templateId
      ? await this.emailTemplateRepository.findOne({
          where: { id: command.templateId, organizationId },
        })
      : null;
    if (command.templateId && !template) {
      throw new NotFoundException('Email template not found');
    }

    const [recruiter, organization] = await Promise.all([
      this.userRepository.findOne({
        where: { id: command.userId, organizationId },
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
    const values = {
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
    };

    const subject = renderMergeFields(
      command.subject ?? template!.subject,
      values,
    );
    const body = renderMergeFields(command.body ?? template!.body, values);

    let sent = false;
    let reason: string | null = null;
    try {
      await this.mailService.sendEmail({
        to: candidate.email,
        subject,
        text: body,
        html: textToHtml(body),
        ...(recruiter?.email && { replyTo: recruiter.email }),
      });
      sent = true;
    } catch (error) {
      reason =
        error instanceof Error ? error.message : 'Mail is not configured';
      this.logger.warn(`Application email not sent: ${reason}`);
    }

    const activity = await this.activityRepository.record({
      organizationId,
      candidateId: candidate.id,
      applicationId: application.id,
      jobId: job.id,
      clientId: job.clientId,
      type: ActivityType.EMAIL,
      title: `Email: ${subject}`,
      body,
      metadata: {
        to: candidate.email,
        subject,
        templateId: template?.id ?? null,
        sent,
        reason,
      },
      actorId: command.userId,
    });

    return {
      sent,
      reason,
      to: candidate.email,
      subject,
      body,
      activityId: activity.id,
    };
  }
}
