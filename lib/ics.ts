// A calendar invite (.ics) for a booked visit. Times are Eastern; the file stores them in UTC.
import { TIME_ZONE } from "./dates";

// Eastern wall-clock time -> UTC Date.
export function easternToUtc(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric",
  }).formatToParts(new Date(guess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess - (shown - guess));
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);

export function buildIcs(o: {
  uid: string;
  date: string;
  time: string;
  hours: number;
  summary: string;
  location: string;
  description: string;
  now?: Date;
}): string {
  const start = easternToUtc(o.date, o.time);
  const end = new Date(start.getTime() + o.hours * 3600_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coastal Air Assessments//Portal//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${o.uid}@caaportal`,
    `DTSTAMP:${stamp(o.now ?? new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(o.summary)}`,
    `LOCATION:${esc(o.location)}`,
    `DESCRIPTION:${esc(o.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
