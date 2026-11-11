import { Injectable } from '@nestjs/common';
import { InterviewBookingLinkRepository } from '@db/repositories';
import { InterviewBookingLinkStatus } from '@db/enums';
import { BookingLinkResponseDto } from '../../dtos/interview-booking.dto';
import { BookingLinkService } from '../../services/booking-link.service';
import { ListBookingLinksCommand } from './list-booking-links.command';

const LIST_LIMIT = 100;

@Injectable()
export class ListBookingLinks {
  constructor(
    private readonly bookingLinkRepository: InterviewBookingLinkRepository,
    private readonly bookingLinkService: BookingLinkService,
  ) {}

  async execute(
    command: ListBookingLinksCommand,
  ): Promise<BookingLinkResponseDto[]> {
    const { organizationId } = command;
    await this.bookingLinkRepository
      .createQueryBuilder()
      .update()
      .set({ status: InterviewBookingLinkStatus.EXPIRED })
      .where('organizationId = :organizationId', { organizationId })
      .andWhere('status = :open', { open: InterviewBookingLinkStatus.OPEN })
      .andWhere('expiresAt <= NOW()')
      .execute();

    const qb = this.bookingLinkRepository
      .createQueryBuilder('link')
      .where('link.organizationId = :organizationId', { organizationId });
    if (command.applicationId) {
      qb.andWhere('link.applicationId = :applicationId', {
        applicationId: command.applicationId,
      });
    }
    if (command.status) {
      qb.andWhere('link.status = :status', { status: command.status });
    }
    const links = await qb
      .orderBy('link.createdAt', 'DESC')
      .take(LIST_LIMIT)
      .getMany();
    return this.bookingLinkService.toResponses(organizationId, links);
  }
}
