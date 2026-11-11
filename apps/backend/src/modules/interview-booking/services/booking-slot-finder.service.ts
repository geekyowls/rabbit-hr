import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InterviewBookingLinkEntity } from '@db/entities';
import { InterviewerAvailabilityService } from './interviewer-availability.service';
import { AvailableSlot, computeAvailableSlots } from './slot-engine';

const MAX_RANGE_MS = 42 * 86_400_000;

@Injectable()
export class BookingSlotFinder {
  constructor(
    private readonly availabilityService: InterviewerAvailabilityService,
  ) {}

  async find(
    manager: EntityManager,
    link: InterviewBookingLinkEntity,
    rangeStart: Date,
    rangeEnd: Date,
    now = new Date(),
  ): Promise<AvailableSlot[]> {
    if (rangeEnd.getTime() <= rangeStart.getTime()) return [];
    if (rangeEnd.getTime() - rangeStart.getTime() > MAX_RANGE_MS) {
      throw new BadRequestException('Pick a range of six weeks or less');
    }
    const schedules = await this.availabilityService.loadSchedules(
      manager,
      link.organizationId,
      link.interviewerIds,
      rangeStart,
      rangeEnd,
    );
    return computeAvailableSlots(schedules, {
      rangeStart,
      rangeEnd,
      durationMinutes: link.durationMinutes,
      mode: link.mode,
      now,
    });
  }
}
