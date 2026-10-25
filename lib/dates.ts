// Date helpers. CAA works on Eastern time, so "today" is always Eastern, not the visitor's clock.
export const TIME_ZONE = "America/New_York";

// Mon-Thu only (0 = Sunday ... 6 = Saturday)
export const BOOKABLE_WEEKDAYS = [1, 2, 3, 4];

export function todayInNewYork(now: Date = new Date()): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function weekdayOf(value: string): number {
  return new Date(`${value}T12:00:00Z`).getUTCDay();
}

export function addDays(value: string, days: number): string {
  const d = new Date(`${value}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The next bookable dates (Mon-Thu), starting `startOffset` days after today.
export function nextBookableDates(
  now: Date = new Date(),
  count = 12,
  startOffset = 1,
): string[] {
  const out: string[] = [];
  let cursor = addDays(todayInNewYork(now), startOffset);
  for (let i = 0; i < 120 && out.length < count; i++) {
    if (BOOKABLE_WEEKDAYS.includes(weekdayOf(cursor))) out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

// "Tue, Oct 27"
export function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
