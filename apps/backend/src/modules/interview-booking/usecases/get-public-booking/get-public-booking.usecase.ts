import { Injectable } from '@nestjs/common';
import { InterviewBookingLinkEntity } from '@db/entities';
import {
  CandidateRepository,
  InterviewRepository,
  JobRepository,
  OrganizationRepository,
} from '@db/repositories';
import { resolveAtsSettings } from '@db/entities';
import { PublicBookingLinkDto } from '../../dtos/interview-booking.dto';
import { BookingLinkService } from '../../services/booking-link.service';
import { PublicBookingTokenCommand } from '../public-booking-token.command';

@Injectable()
export class GetPublicBooking {
  constructor(
    private readonly bookingLinkService: BookingLinkService,
    private readonly organizationRepository: OrganizationRepository,
    private readonly jobRepository: JobRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly interviewRepository: InterviewRepository,
  ) {}

  async execute(
    command: PublicBookingTokenCommand,
  ): Promise<PublicBookingLinkDto> {
    const link = await this.bookingLinkService.loadByToken(command.token);
    return this.describe(link);
  }

  async describe(
    link: InterviewBookingLinkEntity,
  ): Promise<PublicBookingLinkDto> {
    const { organizationId } = link;
    const [organization, job, candidate, interview] = await Promise.all([
      this.organizationRepository.findOne({
        where: { id: organizationId },
        select: ['id', 'name', 'logo', 'atsSettings'],
      }),
      this.jobRepository.findOne({
        where: { id: link.jobId, organizationId },
        select: ['id', 'title'],
      }),
      this.candidateRepository.findOne({
        where: { id: link.candidateId, organizationId },
        select: ['id', 'firstName'],
      }),
      link.bookedInterviewId
        ? this.interviewRepository.findOne({
            where: { id: link.bookedInterviewId, organizationId },
            select: [
              'id',
              'scheduledAt',
              'durationMinutes',
              'timezone',
              'status',
              'meetingUrl',
              'location',
            ],
          })
        : Promise.resolve(null),
    ]);
    const settings = resolveAtsSettings(organization?.atsSettings);
    return {
      status: link.status,
      title: link.title,
      type: link.type,
      durationMinutes: link.durationMinutes,
      jobTitle: job?.title ?? '',
      companyName: organization?.name ?? '',
      companyLogo: organization?.logo ?? null,
      candidateFirstName: candidate?.firstName ?? '',
      timezone: settings.timezone,
      locale: settings.locale,
      expiresAt: link.expiresAt,
      location: link.location,
      booking: interview
        ? {
            interviewId: interview.id,
            scheduledAt: interview.scheduledAt,
            durationMinutes: interview.durationMinutes,
            timezone: interview.timezone,
            status: interview.status,
            meetingUrl: interview.meetingUrl,
            location: interview.location,
          }
        : null,
    };
  }
}
