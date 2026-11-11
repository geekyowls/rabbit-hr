import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ApplicationRepository,
  InterviewBookingLinkRepository,
  UserRepository,
} from '@db/repositories';
import {
  InterviewBookingMode,
  InterviewMeetingProvider,
  InterviewType,
} from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { CandidateEmailService } from '@modules/email-template/services/candidate-email.service';
import { assertInterviewers } from '@modules/interview/usecases/interview-query';
import { interviewTypeLabel } from '@modules/interview/usecases/interview-invite.service';
import { CreateBookingLinkResponseDto } from '../../dtos/interview-booking.dto';
import { BookingLinkService } from '../../services/booking-link.service';
import { CreateBookingLinkCommand } from './create-booking-link.command';

const DEFAULT_DURATION_MINUTES = 30;
const DEFAULT_EXPIRY_DAYS = 7;
const DAY = 86_400_000;

const LINK_SUBJECT = 'Book your interview for {{job.title}}';
const LINK_BODY = [
  'Hi {{candidate.firstName}},',
  '',
  '{{booking.message}}Please choose a time for your {{booking.title}} for the {{job.title}} role using the link below.',
  '',
  '{{booking.url}}',
  '',
  'The interview lasts {{booking.duration}}. This link expires on {{booking.expiresAt}}.',
  '',
  'Kind regards,',
  '{{recruiter.name}}',
  '{{organization.name}}',
].join('\n');

@Injectable()
export class CreateBookingLink {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly userRepository: UserRepository,
    private readonly bookingLinkRepository: InterviewBookingLinkRepository,
    private readonly bookingLinkService: BookingLinkService,
    private readonly candidateEmailService: CandidateEmailService,
    private readonly atsSettingsService: AtsSettingsService,
  ) {}

  async execute(
    command: CreateBookingLinkCommand,
  ): Promise<CreateBookingLinkResponseDto> {
    const { organizationId, userId, payload } = command;
    const application = await this.applicationRepository.findOne({
      where: { id: payload.applicationId, organizationId },
      select: ['id', 'candidateId', 'jobId'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    await assertInterviewers(
      this.userRepository,
      organizationId,
      payload.interviewerIds,
    );

    const type = payload.type ?? InterviewType.VIDEO;
    const link = await this.bookingLinkRepository.save(
      this.bookingLinkRepository.create({
        organizationId,
        applicationId: application.id,
        candidateId: application.candidateId,
        jobId: application.jobId,
        token: this.bookingLinkService.generateToken(),
        title: payload.title ?? `${interviewTypeLabel(type)} interview`,
        type,
        durationMinutes: payload.durationMinutes ?? DEFAULT_DURATION_MINUTES,
        interviewerIds: payload.interviewerIds,
        mode: payload.mode ?? InterviewBookingMode.ANY_INTERVIEWER,
        meetingProvider:
          payload.meetingProvider ?? InterviewMeetingProvider.NONE,
        location: payload.location ?? null,
        expiresAt: new Date(
          Date.now() + (payload.expiresInDays ?? DEFAULT_EXPIRY_DAYS) * DAY,
        ),
        createdBy: userId,
      }),
    );

    const [response] = await this.bookingLinkService.toResponses(
      organizationId,
      [link],
    );
    if (!payload.sendEmail) {
      return { ...response, emailSent: false, emailError: null };
    }

    const [context, settings] = await Promise.all([
      this.candidateEmailService.loadContext(
        application.id,
        organizationId,
        userId,
      ),
      this.atsSettingsService.get(organizationId),
    ]);
    context.values = {
      ...context.values,
      'booking.url': response.url,
      'booking.title': link.title.toLowerCase(),
      'booking.duration': `${link.durationMinutes} minutes`,
      'booking.expiresAt': new Intl.DateTimeFormat(settings.locale, {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: settings.timezone,
      }).format(link.expiresAt),
      'booking.message': payload.message?.trim()
        ? `${payload.message.trim()}\n\n`
        : '',
    };
    const result = await this.candidateEmailService.send({
      organizationId,
      userId,
      context,
      subject: LINK_SUBJECT,
      body: LINK_BODY,
      metadata: { bookingLinkId: link.id },
    });
    return { ...response, emailSent: result.sent, emailError: result.reason };
  }
}
