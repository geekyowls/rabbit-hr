import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InterviewBookingLinkEntity, InterviewEntity } from '@db/entities';
import { ActivityRepository } from '@db/repositories';
import {
  InterviewBookingLinkStatus,
  InterviewBookingMode,
  InterviewMeetingProvider,
} from '@db/enums';
import { ContextLogger } from '@shared/framework/context-logger';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { CandidateEmailService } from '@modules/email-template/services/candidate-email.service';
import { CreateInterview } from '@modules/interview/usecases/create-interview/create-interview.usecase';
import { CreateInterviewCommand } from '@modules/interview/usecases/create-interview/create-interview.command';
import { recordInterviewActivity } from '@modules/interview/usecases/interview-activity';
import { PublicBookingLinkDto } from '../../dtos/interview-booking.dto';
import {
  BookingLinkService,
  SLOT_TAKEN,
} from '../../services/booking-link.service';
import { BookingSlotFinder } from '../../services/booking-slot-finder.service';
import { GetPublicBooking } from '../get-public-booking/get-public-booking.usecase';
import { BookPublicSlotCommand } from './book-public-slot.command';

const AUTO_MEETING_PROVIDERS = [
  InterviewMeetingProvider.GOOGLE_MEET,
  InterviewMeetingProvider.ZOOM,
  InterviewMeetingProvider.TEAMS,
];

const CONFIRMATION_SUBJECT = 'Interview booked: {{job.title}}';
const CONFIRMATION_BODY = [
  'Hi {{candidate.firstName}},',
  '',
  'Thanks for booking your {{booking.title}} for the {{job.title}} role.',
  '',
  'When: {{booking.when}}',
  'Duration: {{booking.duration}}',
  '{{booking.where}}',
  'You will receive a calendar invitation with the joining details where available.',
  '',
  'Need to cancel? Use this link: {{booking.url}}',
  '',
  'Kind regards,',
  '{{recruiter.name}}',
  '{{organization.name}}',
].join('\n');

@Injectable()
export class BookPublicSlot {
  private readonly logger = new ContextLogger(BookPublicSlot.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly bookingLinkService: BookingLinkService,
    private readonly slotFinder: BookingSlotFinder,
    private readonly createInterview: CreateInterview,
    private readonly activityRepository: ActivityRepository,
    private readonly candidateEmailService: CandidateEmailService,
    private readonly atsSettingsService: AtsSettingsService,
    private readonly getPublicBooking: GetPublicBooking,
  ) {}

  async execute(command: BookPublicSlotCommand): Promise<PublicBookingLinkDto> {
    const startsAt = new Date(command.startsAt);
    const initial = await this.bookingLinkService.loadByToken(command.token);
    this.assertOpen(initial);
    const settings = await this.atsSettingsService.get(initial.organizationId);

    const { link, interview, interviewCommand } =
      await this.dataSource.transaction(async (manager) => {
        await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
          `interview-booking:${initial.organizationId}`,
        ]);
        const locked = await this.bookingLinkService.loadByToken(
          command.token,
          manager,
        );
        this.assertOpen(locked);
        const [slot] = await this.slotFinder.find(
          manager,
          locked,
          startsAt,
          new Date(startsAt.getTime() + 1),
        );
        if (!slot || slot.start.getTime() !== startsAt.getTime()) {
          throw new ConflictException(SLOT_TAKEN);
        }
        const actorId =
          locked.createdBy ??
          slot.interviewerIds[0] ??
          locked.interviewerIds[0];
        const auto = AUTO_MEETING_PROVIDERS.includes(locked.meetingProvider);
        const createCommand = CreateInterviewCommand.create({
          organizationId: locked.organizationId,
          userId: actorId,
          payload: {
            applicationId: locked.applicationId,
            title: locked.title,
            type: locked.type,
            scheduledAt: startsAt.toISOString(),
            durationMinutes: locked.durationMinutes,
            timezone: settings.timezone,
            location: locked.location,
            interviewerIds:
              locked.mode === InterviewBookingMode.ANY_INTERVIEWER
                ? [slot.interviewerIds[0]]
                : locked.interviewerIds,
            autoMeetingLink: auto,
            meetingProvider: auto ? locked.meetingProvider : undefined,
            notifyCandidate: false,
            moveToInterviewStage: true,
          },
        });
        const created = await this.createInterview.persist(
          manager,
          createCommand,
        );
        locked.status = InterviewBookingLinkStatus.BOOKED;
        locked.bookedInterviewId = created.id;
        locked.bookedAt = new Date();
        await manager.getRepository(InterviewBookingLinkEntity).save(locked);
        await recordInterviewActivity(
          this.activityRepository,
          {
            interview: created,
            event: 'self_booked',
            title: `Candidate booked an interview: ${created.title}`,
            actorId: null,
            metadata: { bookingLinkId: locked.id },
          },
          manager,
        );
        return {
          link: locked,
          interview: created,
          interviewCommand: createCommand,
        };
      });

    await this.createInterview.finalize(
      interview,
      interviewCommand,
      'booking_link',
    );
    this.sendConfirmation(
      link,
      interview,
      interviewCommand.userId,
      command.timezone ?? settings.timezone,
      settings.locale,
    );
    return this.getPublicBooking.describe(link);
  }

  private assertOpen(link: InterviewBookingLinkEntity): void {
    if (link.status !== InterviewBookingLinkStatus.OPEN) {
      throw new BadRequestException(`This booking link is ${link.status}`);
    }
  }

  private sendConfirmation(
    link: InterviewBookingLinkEntity,
    interview: InterviewEntity,
    userId: string,
    timezone: string,
    locale: string,
  ): void {
    const when = new Intl.DateTimeFormat(locale, {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(new Date(interview.scheduledAt));
    this.candidateEmailService
      .loadContext(link.applicationId, link.organizationId, userId)
      .then((context) => {
        context.values = {
          ...context.values,
          'booking.title': link.title.toLowerCase(),
          'booking.when': `${when} (${timezone})`,
          'booking.duration': `${interview.durationMinutes} minutes`,
          'booking.where': interview.location
            ? `Location: ${interview.location}\n`
            : '',
          'booking.url': this.bookingLinkService.buildUrl(link.token),
        };
        this.candidateEmailService.sendInBackground({
          organizationId: link.organizationId,
          userId,
          context,
          subject: CONFIRMATION_SUBJECT,
          body: CONFIRMATION_BODY,
          metadata: { bookingLinkId: link.id, interviewId: interview.id },
        });
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Booking confirmation not sent: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
  }
}
