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

// The late-cancel fee. Every deposit is larger than this, so a late cancel always leaves a refund.
export const LATE_CANCEL_FEE_CENTS = 25000;

// Which rule a booking is held to: the policy version its client accepted. Bookings accepted under v2
// keep the v2 rule (inside 24 hours the whole deposit is kept, no late reschedule).
export const policyAllowsLateOptions = (policyVersion: string | null | undefined): boolean =>
  !!policyVersion && !policyVersion.startsWith("v2");

export type CancelOutcome = {
  window: "free" | "late";
  hoursBefore: number;
  feeCents: number;
  refundCents: number;
};

// What cancelling now costs. More than 24 hours out: nothing. Inside 24 hours: the fee, and the rest comes back.
// A booking under the old v2 policy keeps its whole deposit inside 24 hours.
export function cancelOutcome(
  date: string,
  time: string,
  depositCents: number,
  policyVersion?: string | null,
  now: Date = new Date(),
): CancelOutcome {
  const hoursBefore = hoursUntil(date, time, now);
  if (hoursBefore > REFUND_WINDOW_HOURS) return { window: "free", hoursBefore, feeCents: 0, refundCents: depositCents };
  const fee = policyAllowsLateOptions(policyVersion) ? Math.min(LATE_CANCEL_FEE_CENTS, depositCents) : depositCents;
  return { window: "late", hoursBefore, feeCents: fee, refundCents: depositCents - fee };
}
