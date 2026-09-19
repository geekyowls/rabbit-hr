import {
  addHours as addHoursFn,
  addDays as addDaysFn,
  addMinutes as addMinutesFn,
} from 'date-fns';

export function addHours(hours: number, from: Date = new Date()): Date {
  return addHoursFn(from, hours);
}

export function addDays(days: number, from: Date = new Date()): Date {
  return addDaysFn(from, days);
}

export function addMinutes(minutes: number, from: Date = new Date()): Date {
  return addMinutesFn(from, minutes);
}
