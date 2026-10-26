import { addDays } from "./dates";
import { formatPhone, issueLabel } from "./labels";

// A link that opens Google Calendar with the job already filled in. Cory taps Save.
// Times are Eastern ("floating" with ctz), so no timezone math is needed here.
export type CalendarJob = {
  name: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  issue: string;
  notes: string;
};
export type CalendarBooking = { date: string; time: string; hours: number };

function stamp(date: string, minutes: number): string {
  const dayShift = Math.floor(minutes / 1440);
  const day = dayShift ? addDays(date, dayShift) : date;
  const m = minutes % 1440;
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${day.replace(/-/g, "")}T${hh}${mm}00`;
}

export function googleCalendarLink(job: CalendarJob, b: CalendarBooking): string {
  const [h, m] = b.time.split(":").map(Number);
  const start = h * 60 + m;
  const end = start + b.hours * 60;
  const details = [
    `${issueLabel(job.issue)}`,
    `Phone: ${formatPhone(job.phone)}`,
    job.notes ? `Notes: ${job.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `CAA: ${job.name}`,
    dates: `${stamp(b.date, start)}/${stamp(b.date, end)}`,
    ctz: "America/New_York",
    location: `${job.address}, ${job.city} FL ${job.zip}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
