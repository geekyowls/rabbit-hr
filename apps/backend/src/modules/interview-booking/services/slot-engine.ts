import {
  addDaysToDateStr,
  toZonedDateStr,
  zonedTimeToUtc,
  zonedWeekday,
} from '@boilerplate/core';
import type { WeeklyHoursInterval } from '@db/entities';
import { InterviewBookingMode } from '@db/enums';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export interface AvailabilitySettings {
  timezone: string;
  weeklyHours: WeeklyHoursInterval[];
  bufferMinutes: number;
  minNoticeMinutes: number;
  maxDaysAhead: number;
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface InterviewerSchedule {
  userId: string;
  availability: AvailabilitySettings;
  interviews: BusyInterval[];
  timeOff: BusyInterval[];
}

export interface SlotQuery {
  rangeStart: Date;
  rangeEnd: Date;
  durationMinutes: number;
  mode: InterviewBookingMode;
  now: Date;
  notAfter?: Date;
}

export interface AvailableSlot {
  start: Date;
  interviewerIds: string[];
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function toTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function normalizeWeeklyHours(
  intervals: WeeklyHoursInterval[],
): WeeklyHoursInterval[] {
  return intervals
    .filter((i) => toMinutes(i.end) > toMinutes(i.start))
    .sort((a, b) => a.day - b.day || toMinutes(a.start) - toMinutes(b.start));
}

export function slotStepMinutes(durationMinutes: number): number {
  return durationMinutes < 30 ? 15 : 30;
}

function overlaps(start: number, end: number, other: BusyInterval): boolean {
  return start < other.end.getTime() && end > other.start.getTime();
}

function freeStarts(schedule: InterviewerSchedule, query: SlotQuery): number[] {
  const { availability } = schedule;
  const tz = availability.timezone;
  const duration = query.durationMinutes * MINUTE;
  const buffer = availability.bufferMinutes * MINUTE;
  const step = slotStepMinutes(query.durationMinutes);
  const earliest = Math.max(
    query.rangeStart.getTime(),
    query.now.getTime() + availability.minNoticeMinutes * MINUTE,
  );
  const latest = Math.min(
    query.rangeEnd.getTime(),
    query.now.getTime() + availability.maxDaysAhead * DAY,
    query.notAfter?.getTime() ?? Number.POSITIVE_INFINITY,
  );
  if (earliest >= latest) return [];

  const hours = normalizeWeeklyHours(availability.weeklyHours);
  const starts: number[] = [];
  const lastDate = toZonedDateStr(new Date(latest), tz);
  for (
    let date = toZonedDateStr(new Date(earliest - DAY), tz);
    date <= lastDate;
    date = addDaysToDateStr(date, 1)
  ) {
    const weekday = zonedWeekday(date);
    for (const interval of hours.filter((h) => h.day === weekday)) {
      const windowEnd = toMinutes(interval.end);
      for (
        let minutes = toMinutes(interval.start);
        minutes + query.durationMinutes <= windowEnd;
        minutes += step
      ) {
        const start = zonedTimeToUtc(date, toTimeLabel(minutes), tz).getTime();
        const end = start + duration;
        if (start < earliest || start >= latest) continue;
        const blocked =
          schedule.timeOff.some((t) => overlaps(start, end, t)) ||
          schedule.interviews.some((i) =>
            overlaps(start - buffer, end + buffer, i),
          );
        if (!blocked) starts.push(start);
      }
    }
  }
  return starts;
}

export function computeAvailableSlots(
  schedules: InterviewerSchedule[],
  query: SlotQuery,
): AvailableSlot[] {
  if (schedules.length === 0) return [];
  const byStart = new Map<number, string[]>();
  for (const schedule of schedules) {
    for (const start of new Set(freeStarts(schedule, query))) {
      const users = byStart.get(start) ?? [];
      users.push(schedule.userId);
      byStart.set(start, users);
    }
  }
  const order = new Map(schedules.map((s, index) => [s.userId, index]));
  return [...byStart.entries()]
    .filter(
      ([, users]) =>
        query.mode === InterviewBookingMode.ANY_INTERVIEWER ||
        users.length === schedules.length,
    )
    .sort(([a], [b]) => a - b)
    .map(([start, users]) => ({
      start: new Date(start),
      interviewerIds: users.sort(
        (a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0),
      ),
    }));
}
