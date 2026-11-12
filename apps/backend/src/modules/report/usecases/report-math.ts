export const DAY_MS = 24 * 60 * 60 * 1000;

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return round1(
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid],
  );
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return round1(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function percent(part: number, whole: number): number | null {
  return whole > 0 ? round1((part / whole) * 100) : null;
}

export function startOfWeek(date: Date, weekStartsOn: number): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const offset = (start.getUTCDay() - weekStartsOn + 7) % 7;
  start.setUTCDate(start.getUTCDate() - offset);
  return start;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function countBy<T>(
  items: T[],
  key: (item: T) => string | null,
): Map<string | null, number> {
  const counts = new Map<string | null, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}
