import { formatDateLong, formatTime } from '@/lib/format';
import { isoToZoned } from '@/components/interviews/interview-data';

export const WINDOW_DAYS = 14;
export const MAX_WINDOWS = 3;

export function browserTimezone(fallback: string) {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

export function todayIn(timezone: string) {
  return isoToZoned(new Date().toISOString(), timezone).date;
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function dateRange(from: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(from, i));
}

function noonUtc(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function dayParts(date: string, locale: string) {
  const at = noonUtc(date);
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    formatDateLong(at, { locale, timezone: 'UTC' }, options);
  return {
    weekday: fmt({ weekday: 'short' }),
    day: fmt({ day: 'numeric' }),
    month: fmt({ month: 'short' }),
    long: fmt({ weekday: 'long', day: 'numeric', month: 'long' }),
  };
}

export function formatSlotDate(iso: string, locale: string, timezone: string) {
  return formatDateLong(
    iso,
    { locale, timezone },
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  );
}

export function formatSlotTime(iso: string, locale: string, timezone: string) {
  return formatTime(iso, { locale, timezone });
}

function icsDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function icsEscape(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export interface CalendarEvent {
  uid: string;
  startsAt: string;
  durationMinutes: number;
  summary: string;
  description: string;
  location?: string | null;
  url?: string | null;
}

export function buildIcs(event: CalendarEvent) {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RabbitHR//Interview booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@rabbithr`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(event.summary)}`,
    `DESCRIPTION:${icsEscape(event.description)}`,
    ...(event.location ? [`LOCATION:${icsEscape(event.location)}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function downloadIcs(event: CalendarEvent, filename: string) {
  const blob = new Blob([buildIcs(event)], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
