// Do two visits overlap? Mirrors the database rule (same day, time ranges).
export type Slot = { date: string; time: string; hours: number };

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function overlaps(a: Slot, b: Slot): boolean {
  if (a.date !== b.date) return false;
  const aStart = minutes(a.time);
  const bStart = minutes(b.time);
  return aStart < bStart + b.hours * 60 && bStart < aStart + a.hours * 60;
}
