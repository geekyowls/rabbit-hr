import { addHours as addHoursFn, addDays as addDaysFn } from 'date-fns';

/**
 * Add hours to current date using date-fns
 * @param hours - Number of hours to add
 * @param from - Starting date (defaults to current time)
 * @returns New date with hours added
 */
export function addHours(hours: number, from: Date = new Date()): Date {
  return addHoursFn(from, hours);
}

/**
 * Add days to current date using date-fns
 * @param days - Number of days to add
 * @param from - Starting date (defaults to current time)
 * @returns New date with days added
 */
export function addDays(days: number, from: Date = new Date()): Date {
  return addDaysFn(from, days);
}
