import { BadRequestException, Injectable } from '@nestjs/common';
import { InterviewBookingLinkRepository } from '@db/repositories';
import { InterviewBookingLinkStatus } from '@db/enums';
import { BookingLinkResponseDto } from '../../dtos/interview-booking.dto';
import { BookingLinkService } from '../../services/booking-link.service';
import { CancelBookingLinkCommand } from './cancel-booking-link.command';

@Injectable()
export class CancelBookingLink {
  constructor(
    private readonly bookingLinkRepository: InterviewBookingLinkRepository,
    private readonly bookingLinkService: BookingLinkService,
  ) {}

  async execute(
    command: CancelBookingLinkCommand,
  ): Promise<BookingLinkResponseDto> {
    const link = await this.bookingLinkService.loadById(
      command.bookingLinkId,
      command.organizationId,
    );
    if (link.status !== InterviewBookingLinkStatus.OPEN) {
      throw new BadRequestException(
        `Only open booking links can be cancelled, this one is ${link.status}`,
      );
    }
    link.status = InterviewBookingLinkStatus.CANCELLED;
    link.cancelledAt = new Date();
    await this.bookingLinkRepository.save(link);
    const [response] = await this.bookingLinkService.toResponses(
      command.organizationId,
      [link],
    );
    return response;
  }
}
