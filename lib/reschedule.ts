import { PHONE, SIGNOFF } from "./business";
import { buildIcs } from "./ics";
import { formatDateLabel } from "./dates";
import { formatTime } from "./labels";
import { hoursUntil, REFUND_WINDOW_HOURS } from "./cancel";
import { bookingUrl } from "./links";
import { SITE_URL_FALLBACK } from "./notify";
import { overlaps, type Slot } from "./slots";

// A client can move their own visit while it is more than 24 hours away and not yet started.
export function canMove(
  r: { status: string; source?: string | null; confirmed_date: string | null; confirmed_time: string | null; arrived_at?: string | null; left_at?: string | null },
  now: Date = new Date(),
): boolean {
  if (r.status !== "confirmed" || (r.source && r.source !== "client") || r.arrived_at || r.left_at) return false;
  if (!r.confirmed_date || !r.confirmed_time) return false;
  return hoursUntil(r.confirmed_date, String(r.confirmed_time).slice(0, 5), now) > REFUND_WINDOW_HOURS;
}

// Open times for the move: not held by anyone else (their own current time does not block them), and more than 24 hours out.
export function moveOptions(
  dates: string[],
  times: readonly string[],
  held: Slot[],
  current: Slot,
  now: Date = new Date(),
): { date: string; time: string }[] {
  const others = held.filter((h) => !(h.date === current.date && h.time === current.time));
  const out: { date: string; time: string }[] = [];
  for (const date of dates) {
    for (const time of times) {
      if (date === current.date && time === current.time) continue;
      if (hoursUntil(date, time, now) <= REFUND_WINDOW_HOURS) continue;
      if (others.some((h) => overlaps(h, { date, time, hours: current.hours }))) continue;
      out.push({ date, time });
    }
  }
  return out;
}

export function movedEmail(
  row: { name: string; address: string; city: string; zip: string; public_token?: string | null },
  id: string,
  slot: Slot,
  siteUrl: string = SITE_URL_FALLBACK,
) {
  const first = row.name.trim().split(/\s+/)[0] || "there";
  const when = `${formatDateLabel(slot.date)} at ${formatTime(slot.time)}`;
  const link = bookingUrl(row, siteUrl);
  const ics = buildIcs({
    uid: id,
    date: slot.date,
    time: slot.time,
    hours: slot.hours,
    summary: "Coastal Air Assessments visit",
    location: `${row.address}, ${row.city} ${row.zip}`,
    description: `Questions? Call or text ${PHONE}.`,
  });
  return {
    subject: `Your visit moved: ${when}`,
    text: [
      `Hi ${first},`,
      "",
      `Your visit is now ${when}. Same place: ${row.address}, ${row.city} ${row.zip}.`,
      "Your deposit carries over. Nothing else to do.",
      "",
      "A new calendar invite is attached. It replaces the old one.",
      "",
      ...(link ? [`Your booking, any time: ${link}`, ""] : []),
      `Questions? Call or text ${PHONE}.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
    attachments: [{ filename: "visit.ics", content: Buffer.from(ics).toString("base64") }],
  };
}
