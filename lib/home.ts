// The days the Home schedule shows: today and every bookable day after it, a few weeks out.
import { addDays } from "./dates";
import { buildWeek, mondayOf, type Block, type Day, type WeekRow } from "./week";

export function homeDays(rows: WeekRow[], blocks: Block[], today: string, weeks = 3): Day[] {
  const monday = mondayOf(today);
  const all: Day[] = [];
  for (let i = 0; i < weeks; i++) all.push(...buildWeek(rows, addDays(monday, i * 7), blocks));
  return all.filter((d) => d.date >= today);
}

// Which days belong to the same week as `date`, in order.
export function weekOf(days: Day[], date: string): Day[] {
  const monday = mondayOf(date);
  return days.filter((d) => mondayOf(d.date) === monday);
}

// A back link the actions may use, so a tap returns to the same day and view. Anything else is ignored.
export function homeBack(day: string, view: string): string {
  const v = view === "week" ? "week" : "day";
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? `/admin/today?d=${day}&v=${v}` : "/admin/today";
}
export const safeBack = (v: unknown): string | null =>
  typeof v === "string" && /^\/admin\/today(\?d=\d{4}-\d{2}-\d{2}&v=(day|week))?$/.test(v) ? v : null;
