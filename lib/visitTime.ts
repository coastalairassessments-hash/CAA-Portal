// Times for a visit entered by hand (back at the office, or a forgotten tap). Pure, so it is easy to test.
const TZ = "America/New_York";

// Minutes New York is ahead of UTC at a moment (negative: behind).
function offsetMinutes(at: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(at).map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

// "2026-11-10" + "14:30" in New York -> a moment in time.
export function newYorkToDate(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [y, mo, da, h, mi] = [+d[1], +d[2], +d[3], +t[1], +t[2]];
  if (mo < 1 || mo > 12 || da < 1 || da > 31 || h > 23 || mi > 59) return null;
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  let at = new Date(guess - offsetMinutes(new Date(guess)) * 60000);
  at = new Date(guess - offsetMinutes(at) * 60000); // settle across a clock change
  return Number.isNaN(at.getTime()) ? null : at;
}

export type VisitEntry = { date: string; arrive: string; leave: string; hours: string; plannedTime: string | null };
export type VisitResult = { ok: true; arrived_at: string; left_at: string } | { ok: false; error: string };

// Either Arrived + Left clock times, or a total number of hours (counted from Arrived, or the planned start).
export function visitFromEntry(e: VisitEntry): VisitResult {
  const start = e.arrive.trim() || (e.plannedTime ?? "").slice(0, 5);
  const arrived = newYorkToDate(e.date, start);
  if (!arrived) return { ok: false, error: "Enter the date and the time you arrived." };
  const hoursText = e.hours.trim();
  if (hoursText) {
    const h = Number(hoursText.replace(",", "."));
    if (!Number.isFinite(h) || h <= 0 || h > 16) return { ok: false, error: "Hours must be a number between 0.25 and 16." };
    const left = new Date(arrived.getTime() + Math.round(h * 60) * 60000);
    return { ok: true, arrived_at: arrived.toISOString(), left_at: left.toISOString() };
  }
  const left = newYorkToDate(e.date, e.leave.trim());
  if (!left) return { ok: false, error: "Enter the time you left, or the total hours." };
  if (left.getTime() <= arrived.getTime()) return { ok: false, error: "Left must be after Arrived." };
  if (left.getTime() - arrived.getTime() > 16 * 3600_000) return { ok: false, error: "That visit is longer than 16 hours. Check the times." };
  return { ok: true, arrived_at: arrived.toISOString(), left_at: left.toISOString() };
}
