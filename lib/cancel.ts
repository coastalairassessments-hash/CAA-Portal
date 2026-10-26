// The cancellation rule: more than 24 hours before the visit is a full refund; inside 24 is not.
export const REFUND_WINDOW_HOURS = 24;

// Eastern wall-clock date + time -> the real moment in time (handles daylight saving).
export function easternInstant(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  const offsetAt = (utcMs: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(utcMs));
    const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
    return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute")) - utcMs;
  };
  // Two passes settle the offset even right at a clock change.
  let guess = wall - offsetAt(wall);
  guess = wall - offsetAt(guess);
  return new Date(guess);
}

export function hoursUntil(date: string, time: string, now: Date = new Date()): number {
  return (easternInstant(date, time).getTime() - now.getTime()) / 3_600_000;
}

export const refundDue = (date: string, time: string, now: Date = new Date()): boolean =>
  hoursUntil(date, time, now) > REFUND_WINDOW_HOURS;
