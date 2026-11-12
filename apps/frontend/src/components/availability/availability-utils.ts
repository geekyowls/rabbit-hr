import { z } from 'zod/v4';
import type { WeeklyHoursInterval } from '@/types/availability.type';

export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DEFAULT_INTERVAL = { start: '09:00', end: '17:00' };

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function timeLabel(value: string) {
  if (value === '24:00') return 'Midnight';
  const [h, m] = value.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${suffix}`;
}

export const TIME_OPTIONS = [
  ...Array.from({ length: 96 }, (_, i) => {
    const value = `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`;
    return { value, label: timeLabel(value) };
  }),
  { value: '24:00', label: timeLabel('24:00') },
];

export const MIN_NOTICE_OPTIONS = [
  { value: 0, label: 'No minimum' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: '1 day' },
  { value: 2880, label: '2 days' },
  { value: 4320, label: '3 days' },
  { value: 10080, label: '1 week' },
];

export const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60, 90, 120];

export function minutesLabel(minutes: number) {
  if (minutes === 0) return 'None';
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? '1 day' : `${days} days`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
  return rest ? `${hourText} ${rest} min` : hourText;
}

const intervalSchema = z.object({ start: z.string(), end: z.string() });

const daySchema = z.object({
  enabled: z.boolean(),
  intervals: z.array(intervalSchema),
});

export const availabilitySchema = z
  .object({
    timezone: z.string().min(1, 'Choose a time zone'),
    days: z.array(daySchema).length(7),
    bufferMinutes: z.number().int().min(0).max(240),
    minNoticeMinutes: z.number().int().min(0).max(43200),
    maxDaysAhead: z
      .number('Enter a number of days')
      .int('Use whole days')
      .min(1, 'At least 1 day')
      .max(180, 'Up to 180 days'),
  })
  .superRefine((values, ctx) => {
    values.days.forEach((day, dayIndex) => {
      if (!day.enabled) return;
      const sorted = day.intervals
        .map((interval, index) => ({ ...interval, index }))
        .sort((a, b) => a.start.localeCompare(b.start));
      day.intervals.forEach((interval, index) => {
        if (interval.end <= interval.start) {
          ctx.addIssue({
            code: 'custom',
            path: ['days', dayIndex, 'intervals', index, 'end'],
            message: 'End time must be after start time',
          });
        }
      });
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].start < sorted[i - 1].end) {
          ctx.addIssue({
            code: 'custom',
            path: ['days', dayIndex, 'intervals', sorted[i].index, 'end'],
            message: 'Overlaps another time range',
          });
        }
      }
    });
    const total = values.days.reduce(
      (sum, day) => sum + (day.enabled ? day.intervals.length : 0),
      0,
    );
    if (total > 28) {
      ctx.addIssue({
        code: 'custom',
        path: ['days'],
        message: 'Up to 28 time ranges per week',
      });
    }
  });

export type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

export function toDays(weeklyHours: WeeklyHoursInterval[]) {
  return Array.from({ length: 7 }, (_, day) => {
    const intervals = weeklyHours
      .filter((w) => w.day === day)
      .map(({ start, end }) => ({ start, end }))
      .sort((a, b) => a.start.localeCompare(b.start));
    return { enabled: intervals.length > 0, intervals };
  });
}

export function toWeeklyHours(
  days: AvailabilityFormValues['days'],
): WeeklyHoursInterval[] {
  return days.flatMap((day, index) =>
    day.enabled
      ? day.intervals.map((interval) => ({ day: index, ...interval }))
      : [],
  );
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}
