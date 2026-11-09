// What a client may pick. Only paid (confirmed) visits and time away hold a slot.
import { overlaps, type Slot } from "./slots";
import { driveConflict, type DriveZone, type Zoned } from "./driveTime";

export const SLOT_TIMES = ["10:00", "12:30"] as const;

// Is this start time free for a visit of `hours`? (Over 2 hours takes the whole day.)
export function slotTaken(held: Slot[], date: string, time: string, hours: number): boolean {
  const want: Slot = { date, time, hours };
  return held.some((h) => overlaps(want, h));
}

// A start time is also out when the drive from another visit that day is too long.
export function slotUnavailable(held: Zoned[], date: string, time: string, hours: number, zone?: DriveZone | null): boolean {
  if (slotTaken(held, date, time, hours)) return true;
  return !!zone && !!driveConflict(held, { date, time, hours, zone });
}

// A day is full when no start time is left for this visit.
export function dayFull(held: Zoned[], date: string, hours: number, zone?: DriveZone | null): boolean {
  return SLOT_TIMES.every((t) => slotUnavailable(held, date, t, hours, zone));
}

// Hours used to test a client's choice: a longer visit (any size over 2 hours) needs the whole day.
export const hoursForTest = (longVisit: boolean) => (longVisit ? 3 : 1);

// The first open start time, so a client can book the soonest slot in one tap.
export function soonestSlot(dates: string[], held: Zoned[], longVisit: boolean, zone?: DriveZone | null): { date: string; time: string } | null {
  const hours = hoursForTest(longVisit);
  for (const date of [...dates].sort()) {
    for (const time of SLOT_TIMES) {
      if (longVisit && time !== "10:00") continue;
      if (!slotUnavailable(held, date, time, hours, zone)) return { date, time };
    }
  }
  return null;
}
