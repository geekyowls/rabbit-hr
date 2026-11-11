import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InterviewBookingLinkEntity } from '@db/entities';
import { InterviewRepository } from '@db/repositories';
import { InterviewBookingLinkStatus, InterviewStatus } from '@db/enums';
import { UpdateInterviewStatus } from '@modules/interview/usecases/update-interview-status/update-interview-status.usecase';
import { UpdateInterviewStatusCommand } from '@modules/interview/usecases/update-interview-status/update-interview-status.command';
import { PublicBookingLinkDto } from '../../dtos/interview-booking.dto';
import { BookingLinkService } from '../../services/booking-link.service';
import { GetPublicBooking } from '../get-public-booking/get-public-booking.usecase';
import { CancelPublicBookingCommand } from './cancel-public-booking.command';

const DEFAULT_REASON = 'Cancelled by the candidate via the booking link';

@Injectable()
export class CancelPublicBooking {
  constructor(
    private readonly dataSource: DataSource,
    private readonly bookingLinkService: BookingLinkService,
    private readonly interviewRepository: InterviewRepository,
    private readonly updateInterviewStatus: UpdateInterviewStatus,
    private readonly getPublicBooking: GetPublicBooking,
  ) {}

  async execute(
    command: CancelPublicBookingCommand,
  ): Promise<PublicBookingLinkDto> {
    const link = await this.bookingLinkService.loadByToken(command.token);
    if (
      link.status !== InterviewBookingLinkStatus.OPEN &&
      link.status !== InterviewBookingLinkStatus.BOOKED
    ) {
      throw new BadRequestException(`This booking link is ${link.status}`);
    }

    if (
      link.status === InterviewBookingLinkStatus.BOOKED &&
      link.bookedInterviewId
    ) {
      const interview = await this.interviewRepository.findOne({
        where: {
          id: link.bookedInterviewId,
          organizationId: link.organizationId,
        },
      });
      if (interview?.status === InterviewStatus.SCHEDULED) {
        if (new Date(interview.scheduledAt).getTime() <= Date.now()) {
          throw new BadRequestException('This interview has already started');
        }
        await this.updateInterviewStatus.execute(
          UpdateInterviewStatusCommand.create({
            organizationId: link.organizationId,
            userId:
              link.createdBy ??
              interview.organizerId ??
              interview.interviewerIds[0],
            interviewId: interview.id,
            status: InterviewStatus.CANCELLED,
            reason: command.reason?.trim() || DEFAULT_REASON,
          }),
        );
      }
    }

    link.status = InterviewBookingLinkStatus.CANCELLED;
    link.cancelledAt = new Date();
    await this.dataSource
      .getRepository(InterviewBookingLinkEntity)
      .update(
        { id: link.id, organizationId: link.organizationId },
        { status: link.status, cancelledAt: link.cancelledAt },
      );
    return this.getPublicBooking.describe(link);
  }
}
