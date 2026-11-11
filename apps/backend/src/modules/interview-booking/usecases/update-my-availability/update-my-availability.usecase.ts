import { BadRequestException, Injectable } from '@nestjs/common';
import { InterviewerAvailabilityRepository } from '@db/repositories';
import { AvailabilityResponseDto } from '../../dtos/interview-booking.dto';
import { DEFAULT_AVAILABILITY } from '../../services/interviewer-availability.service';
import { normalizeWeeklyHours, toMinutes } from '../../services/slot-engine';
import { GetMyAvailability } from '../get-my-availability/get-my-availability.usecase';
import { GetMyAvailabilityCommand } from '../get-my-availability/get-my-availability.command';
import { UpdateMyAvailabilityCommand } from './update-my-availability.command';

@Injectable()
export class UpdateMyAvailability {
  constructor(
    private readonly availabilityRepository: InterviewerAvailabilityRepository,
    private readonly getMyAvailability: GetMyAvailability,
  ) {}

  async execute(
    command: UpdateMyAvailabilityCommand,
  ): Promise<AvailabilityResponseDto> {
    const { organizationId, userId, payload } = command;
    if (
      payload.weeklyHours.some((h) => toMinutes(h.end) <= toMinutes(h.start))
    ) {
      throw new BadRequestException('Each interval must end after it starts');
    }
    const weeklyHours = normalizeWeeklyHours(
      payload.weeklyHours.map(({ day, start, end }) => ({ day, start, end })),
    );
    const overlapping = weeklyHours.some(
      (h, index) =>
        index > 0 &&
        weeklyHours[index - 1].day === h.day &&
        toMinutes(weeklyHours[index - 1].end) > toMinutes(h.start),
    );
    if (overlapping) {
      throw new BadRequestException('Intervals on the same day cannot overlap');
    }

    const existing = await this.availabilityRepository.findOne({
      where: { organizationId, userId },
    });
    const row =
      existing ??
      this.availabilityRepository.create({
        organizationId,
        userId,
        ...DEFAULT_AVAILABILITY,
      });
    Object.assign(row, {
      timezone: payload.timezone,
      weeklyHours,
      ...(payload.bufferMinutes !== undefined && {
        bufferMinutes: payload.bufferMinutes,
      }),
      ...(payload.minNoticeMinutes !== undefined && {
        minNoticeMinutes: payload.minNoticeMinutes,
      }),
      ...(payload.maxDaysAhead !== undefined && {
        maxDaysAhead: payload.maxDaysAhead,
      }),
    });
    await this.availabilityRepository.save(row);
    return this.getMyAvailability.execute(
      GetMyAvailabilityCommand.create({ organizationId, userId }),
    );
  }
}
