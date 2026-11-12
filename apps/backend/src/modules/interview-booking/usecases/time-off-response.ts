import { BadRequestException } from '@nestjs/common';
import { UserTimeOffEntity } from '@db/entities';
import {
  CreateTimeOffDto,
  TimeOffResponseDto,
} from '../dtos/interview-booking.dto';

const MAX_TIME_OFF_DAYS = 366;

export function toTimeOffResponse(row: UserTimeOffEntity): TimeOffResponseDto {
  return {
    id: row.id,
    userId: row.userId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    allDay: row.allDay,
    reason: row.reason,
    createdAt: row.createdAt,
  };
}

export function parseTimeOffRange(payload: CreateTimeOffDto) {
  const startsAt = new Date(payload.startsAt);
  const endsAt = new Date(payload.endsAt);
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new BadRequestException('Time off must end after it starts');
  }
  if (endsAt.getTime() - startsAt.getTime() > MAX_TIME_OFF_DAYS * 86_400_000) {
    throw new BadRequestException('Time off cannot be longer than a year');
  }
  return {
    startsAt,
    endsAt,
    allDay: payload.allDay ?? false,
    reason: payload.reason?.trim() || null,
  };
}
