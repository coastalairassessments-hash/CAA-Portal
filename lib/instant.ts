// Rules for booking and paying in one go. Pure, so every rule is easy to test.
import { needsQuote } from "./intake";

// How long a time is held while the client pays. After this the time is free again.
export const HOLD_MINUTES = 15;
// A little longer before we give up on an unpaid booking, in case they are mid-payment.
export const GIVE_UP_MINUTES = 45;

// Visit length we plan for, from the size of the property. Cory can change it afterward.
export function hoursFor(issue: string, sizeBand: string): number {
  if (issue === "consultation") return 1;
  if (sizeBand === "2000_4000") return 3;
  if (sizeBand === "4000_6000") return 4;
  return 1;
}

// Who can book and pay right away. Everyone else sends a request and we confirm the price.
export function canBookInstantly(r: { area: string; propertyType?: string | null; sizeBand: string }): boolean {
  if (r.area !== "core") return false;
  if (!r.propertyType || needsQuote(r.propertyType)) return false;
  return r.sizeBand !== "over_6000";
}

const minutesSince = (iso: string, now: Date) => (now.getTime() - new Date(iso).getTime()) / 60000;

type HoldRow = { status: string; booking_mode?: string | null; offered_at?: string | null };

// An unpaid instant booking that still holds its time.
export const holdActive = (r: HoldRow, now: Date = new Date()) =>
  r.status === "offered" && r.booking_mode === "instant" && !!r.offered_at && minutesSince(r.offered_at, now) < HOLD_MINUTES;

// An unpaid instant booking that has waited too long.
export const holdAbandoned = (r: HoldRow, now: Date = new Date()) =>
  r.status === "offered" && r.booking_mode === "instant" && !!r.offered_at && minutesSince(r.offered_at, now) >= GIVE_UP_MINUTES;

// When the hold ends, for "held until 2:41 PM".
export const holdEndsAt = (offeredAtIso: string) => new Date(new Date(offeredAtIso).getTime() + HOLD_MINUTES * 60000);
