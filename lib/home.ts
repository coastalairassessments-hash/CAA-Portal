// The days the Home schedule shows: today and every bookable day after it, a few weeks out.
import { addDays } from "./dates";
import { buildWeek, mondayOf, type Block, type Day, type WeekRow } from "./week";

// How many weeks the schedule draws. Anything booked after this is listed under "Later", never left out.
export const HOME_WEEKS = 3;

export function homeDays(rows: WeekRow[], blocks: Block[], today: string, weeks = HOME_WEEKS): Day[] {
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

// The last date the schedule above draws (the Sunday that ends its final week).
export function homeWindowEnd(today: string, weeks = HOME_WEEKS): string {
  return addDays(mondayOf(today), weeks * 7 - 1);
}

type Booked = { status: string; confirmed_date: string | null; confirmed_time: string | null; left_at?: string | null };

// Confirmed visits that fall after the schedule's window, soonest first. Customers can book months ahead.
export function laterBookings<T extends Booked>(rows: T[], today: string, weeks = HOME_WEEKS): T[] {
  const end = homeWindowEnd(today, weeks);
  return rows
    .filter((r) => r.status === "confirmed" && !r.left_at && !!r.confirmed_date && r.confirmed_date > end)
    .sort((a, b) => `${a.confirmed_date} ${a.confirmed_time ?? ""}`.localeCompare(`${b.confirmed_date} ${b.confirmed_time ?? ""}`));
}
