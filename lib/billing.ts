import { depositCents, firstHourCents } from "./pricing";

// Extra time is billed in 15-minute steps after the first hour, rounded up.
export const QUARTER_HOUR_CENTS = 4875; // $195 per hour
export const SAMPLE_CENTS = 8500;

export function minutesOnSite(arrivedIso: string | null, leftIso: string | null): number | null {
  if (!arrivedIso || !leftIso) return null;
  const ms = new Date(leftIso).getTime() - new Date(arrivedIso).getTime();
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 60000) : null;
}

export const extraQuarterHours = (minutes: number): number =>
  Math.max(0, Math.ceil((minutes - 60) / 15));

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export type FinalInput = {
  issue: string;
  minutes: number | null;
  samples: number | null;
  extrasCents: number;
  depositPaidCents: number | null;
  // Not ready or no access: only the charges (the trip fee) are billed, not the first hour.
  tripOnly?: boolean;
};

export function finalInvoice(i: FinalInput) {
  const firstHour = i.tripOnly ? 0 : firstHourCents(i.issue);
  const quarters = i.tripOnly || i.minutes === null ? 0 : extraQuarterHours(i.minutes);
  const extraTime = quarters * QUARTER_HOUR_CENTS;
  const samples = i.tripOnly ? 0 : (i.samples ?? 0) * SAMPLE_CENTS;
  const total = firstHour + extraTime + samples + i.extrasCents;
  const deposit = i.depositPaidCents ?? 0;
  return { firstHour, quarters, extraTime, samples, extras: i.extrasCents, total, deposit, balance: total - deposit, tripOnly: !!i.tripOnly };
}

export { depositCents };
