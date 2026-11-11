import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  addDaysToDateStr,
  toZonedDateStr,
  toZonedTimeStr,
  zonedTimeToUtc,
} from '@boilerplate/core';
import { InterviewBookingLinkStatus } from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import {
  PublicSlotDayDto,
  PublicSlotsResponseDto,
} from '../../dtos/interview-booking.dto';
import { BookingLinkService } from '../../services/booking-link.service';
import { BookingSlotFinder } from '../../services/booking-slot-finder.service';
import { ListPublicBookingSlotsCommand } from './list-public-booking-slots.command';

@Injectable()
export class ListPublicBookingSlots {
  constructor(
    private readonly dataSource: DataSource,
    private readonly bookingLinkService: BookingLinkService,
    private readonly slotFinder: BookingSlotFinder,
    private readonly atsSettingsService: AtsSettingsService,
  ) {}

  async execute(
    command: ListPublicBookingSlotsCommand,
  ): Promise<PublicSlotsResponseDto> {
    const link = await this.bookingLinkService.loadByToken(command.token);
    const timezone =
      command.timezone ??
      (await this.atsSettingsService.get(link.organizationId)).timezone;
    const response: PublicSlotsResponseDto = {
      timezone,
      durationMinutes: link.durationMinutes,
      days: [],
    };
    if (link.status !== InterviewBookingLinkStatus.OPEN) return response;

    const from = command.from <= command.to ? command.from : command.to;
    const to = command.from <= command.to ? command.to : command.from;
    const slots = await this.slotFinder.find(
      this.dataSource.manager,
      link,
      zonedTimeToUtc(from, '00:00', timezone),
      zonedTimeToUtc(addDaysToDateStr(to, 1), '00:00', timezone),
    );

    const days = new Map<string, PublicSlotDayDto>();
    for (const slot of slots) {
      const date = toZonedDateStr(slot.start, timezone);
      const day = days.get(date) ?? { date, slots: [] };
      day.slots.push({
        startsAt: slot.start.toISOString(),
        time: toZonedTimeStr(slot.start, timezone),
      });
      days.set(date, day);
    }
    response.days = [...days.values()];
    return response;
  }
}
