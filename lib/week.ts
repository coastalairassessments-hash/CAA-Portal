// The week at a glance: for each Mon-Thu day and start time, is it open, asked for, or booked?
import { addDays, weekdayOf } from "./dates";
import { overlaps } from "./slots";
import { SLOT_TIMES } from "./availability";

export type WeekRow = {
  id: string;
  status: string;
  name: string;
  issue: string;
  confirmed_date: string | null;
  confirmed_time: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  block_hours: number | null;
};

export type Cell = {
  time: string;
  state: "open" | "pending" | "booked" | "blocked" | "closed";
  rows: WeekRow[];
};
export type Day = { date: string; cells: Cell[]; dayClosed: boolean };
export type Block = { day: string; slot: string };

export const mondayOf = (date: string) => addDays(date, -((weekdayOf(date) + 6) % 7));
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

export function buildWeek(rows: WeekRow[], monday: string, blocks: Block[] = []): Day[] {
  return [0, 1, 2, 3].map((n) => {
    const date = addDays(monday, n);
    const dayClosed = blocks.some((b) => b.day === date && b.slot === "all");
    const cells = SLOT_TIMES.map((time): Cell => {
      const booked = rows.filter(
        (r) =>
          r.status === "confirmed" &&
          r.confirmed_date === date &&
          overlaps({ date, time, hours: 1 }, { date, time: hhmm(r.confirmed_time), hours: r.block_hours ?? 1 }),
      );
      if (booked.length) {
        const own = booked.some((r) => hhmm(r.confirmed_time) === time);
        return { time, state: own ? "booked" : "blocked", rows: booked };
      }
      if (dayClosed || blocks.some((b) => b.day === date && b.slot === time)) return { time, state: "closed", rows: [] };
      const asked = rows.filter((r) => {
        if (r.status !== "new" && r.status !== "offered") return false;
        const d = r.status === "offered" && r.confirmed_date ? r.confirmed_date : r.preferred_date;
        const t = r.status === "offered" && r.confirmed_time ? r.confirmed_time : r.preferred_time;
        return d === date && hhmm(t) === time;
      });
      return { time, state: asked.length ? "pending" : "open", rows: asked };
    });
    return { date, cells, dayClosed };
  });
}
