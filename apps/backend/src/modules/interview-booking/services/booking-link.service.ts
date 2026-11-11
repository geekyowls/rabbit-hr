import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { EntityManager, In } from 'typeorm';
import { InterviewBookingLinkEntity } from '@db/entities';
import {
  InterviewBookingLinkRepository,
  InterviewRepository,
  UserRepository,
} from '@db/repositories';
import { InterviewBookingLinkStatus } from '@db/enums';
import { BookingLinkResponseDto } from '../dtos/interview-booking.dto';

export const BOOKING_LINK_NOT_FOUND = 'This booking link is not valid';
export const SLOT_TAKEN =
  'Sorry, this time was just taken. Please pick another slot';

@Injectable()
export class BookingLinkService {
  private readonly frontendUrl: string;

  constructor(
    private readonly bookingLinkRepository: InterviewBookingLinkRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly userRepository: UserRepository,
    configService: ConfigService,
  ) {
    this.frontendUrl = (
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  generateToken(): string {
    return randomBytes(24).toString('base64url');
  }

  buildUrl(token: string): string {
    return `${this.frontendUrl}/book?token=${encodeURIComponent(token)}`;
  }

  isExpired(link: InterviewBookingLinkEntity, now = new Date()): boolean {
    return (
      link.status === InterviewBookingLinkStatus.OPEN &&
      new Date(link.expiresAt).getTime() <= now.getTime()
    );
  }

  async expireIfNeeded(
    link: InterviewBookingLinkEntity,
    manager?: EntityManager,
  ): Promise<InterviewBookingLinkEntity> {
    if (!this.isExpired(link)) return link;
    link.status = InterviewBookingLinkStatus.EXPIRED;
    const repo = manager
      ? manager.getRepository(InterviewBookingLinkEntity)
      : this.bookingLinkRepository;
    await repo.update(
      { id: link.id, organizationId: link.organizationId },
      { status: InterviewBookingLinkStatus.EXPIRED },
    );
    return link;
  }

  async loadByToken(
    token: string,
    manager?: EntityManager,
  ): Promise<InterviewBookingLinkEntity> {
    const repo = manager
      ? manager.getRepository(InterviewBookingLinkEntity)
      : this.bookingLinkRepository;
    const link = await repo.findOne({ where: { token } });
    if (!link) {
      throw new NotFoundException(BOOKING_LINK_NOT_FOUND);
    }
    return this.expireIfNeeded(link, manager);
  }

  async loadById(
    id: string,
    organizationId: string,
  ): Promise<InterviewBookingLinkEntity> {
    const link = await this.bookingLinkRepository.findOne({
      where: { id, organizationId },
    });
    if (!link) {
      throw new NotFoundException('Booking link not found');
    }
    return this.expireIfNeeded(link);
  }

  async toResponses(
    organizationId: string,
    links: InterviewBookingLinkEntity[],
  ): Promise<BookingLinkResponseDto[]> {
    if (links.length === 0) return [];
    const now = new Date();
    const userIds = [...new Set(links.flatMap((l) => l.interviewerIds))];
    const interviewIds = links
      .map((l) => l.bookedInterviewId)
      .filter((id): id is string => !!id);
    const [users, interviews] = await Promise.all([
      userIds.length > 0
        ? this.userRepository.find({
            where: { id: In(userIds), organizationId },
            select: ['id', 'firstName', 'lastName', 'email'],
          })
        : Promise.resolve([]),
      interviewIds.length > 0
        ? this.interviewRepository.find({
            where: { id: In(interviewIds), organizationId },
            select: ['id', 'scheduledAt', 'status'],
          })
        : Promise.resolve([]),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    const interviewById = new Map(interviews.map((i) => [i.id, i]));
    return links.map((link) => ({
      id: link.id,
      applicationId: link.applicationId,
      candidateId: link.candidateId,
      jobId: link.jobId,
      token: link.token,
      url: this.buildUrl(link.token),
      title: link.title,
      type: link.type,
      durationMinutes: link.durationMinutes,
      interviewerIds: link.interviewerIds,
      interviewers: link.interviewerIds
        .map((id) => userById.get(id))
        .filter((u): u is NonNullable<typeof u> => !!u)
        .map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
        })),
      mode: link.mode,
      meetingProvider: link.meetingProvider,
      location: link.location,
      expiresAt: link.expiresAt,
      status: this.isExpired(link, now)
        ? InterviewBookingLinkStatus.EXPIRED
        : link.status,
      bookedInterviewId: link.bookedInterviewId,
      bookedInterview: link.bookedInterviewId
        ? (interviewById.get(link.bookedInterviewId) ?? null)
        : null,
      bookedAt: link.bookedAt,
      cancelledAt: link.cancelledAt,
      createdBy: link.createdBy,
      createdAt: link.createdAt,
    }));
  }
}
