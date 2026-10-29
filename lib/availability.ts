// What a client may pick. Only paid (confirmed) visits and time away hold a slot.
import { overlaps, type Slot } from "./slots";

export const SLOT_TIMES = ["10:00", "12:30"] as const;

// Is this start time free for a visit of `hours`? (Over 2 hours takes the whole day.)
export function slotTaken(held: Slot[], date: string, time: string, hours: number): boolean {
  const want: Slot = { date, time, hours };
  return held.some((h) => overlaps(want, h));
}

// A day is full when no start time is left for this visit.
export function dayFull(held: Slot[], date: string, hours: number): boolean {
  return SLOT_TIMES.every((t) => slotTaken(held, date, t, hours));
}

// Hours used to test a client's choice: a longer visit (any size over 2 hours) needs the whole day.
export const hoursForTest = (longVisit: boolean) => (longVisit ? 3 : 1);
