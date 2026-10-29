// Do two visits overlap? Mirrors the database rule (migration 0011).
export type Slot = { date: string; time: string; hours: number };

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// A visit longer than 2 hours blocks the whole day. Up to 2 hours holds only its own time.
export const LONG_VISIT_HOURS = 2;
const span = (s: Slot): [number, number] =>
  s.hours > LONG_VISIT_HOURS ? [0, 24 * 60] : [minutes(s.time), minutes(s.time) + s.hours * 60];

export function overlaps(a: Slot, b: Slot): boolean {
  if (a.date !== b.date) return false;
  const [aStart, aEnd] = span(a);
  const [bStart, bEnd] = span(b);
  return aStart < bEnd && bStart < aEnd;
}

// 1:00 PM is the latest start for any visit.
export const LATEST_START = "13:00";
