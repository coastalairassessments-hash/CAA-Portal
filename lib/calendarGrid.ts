// Month grid for the booking calendar: rows of Monday to Thursday, since those are the only
// bookable days. A cell is null when it belongs to another month.
import { addDays, weekdayOf } from "./dates";

export const monthOf = (date: string) => date.slice(0, 7);

export function monthsOf(dates: string[]): string[] {
  return [...new Set(dates.map(monthOf))].sort();
}

export function monthWeeks(month: string): (string | null)[][] {
  const first = `${month}-01`;
  // Back up to the Monday of the week that contains the 1st.
  const back = (weekdayOf(first) + 6) % 7;
  let monday = addDays(first, -back);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < 6; i++) {
    const row = [0, 1, 2, 3].map((n) => {
      const d = addDays(monday, n);
      return monthOf(d) === month ? d : null;
    });
    if (row.some(Boolean)) weeks.push(row);
    monday = addDays(monday, 7);
    if (monthOf(monday) > month && monthOf(addDays(monday, 3)) > month) break;
  }
  return weeks;
}

export function monthTitle(month: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T12:00:00Z`),
  );
}
