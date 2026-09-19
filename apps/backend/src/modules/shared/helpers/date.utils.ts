import { addDays, parse, format, startOfDay, differenceInDays } from 'date-fns';

const IST_TIMEZONE = 'Asia/Kolkata';

export function getISTDateStr(offsetDays: number = 0): string {
  const now = new Date();
  const targetDate = addDays(now, offsetDays);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(targetDate);
}

export function getISTToday(): Date {
  const dateStr = getISTDateStr(0);
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

export function formatDateStr(date: Date | string): string {
  if (typeof date === 'string') return date;
  return format(date, 'yyyy-MM-dd');
}

export function daysBetween(start: Date, end: Date): number {
  return differenceInDays(startOfDay(end), startOfDay(start));
}
