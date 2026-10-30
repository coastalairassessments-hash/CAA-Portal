// The confirmation email with its calendar invite. One home, used when Cory marks a deposit received
// and when a client's payment is noticed automatically.
import { confirmEmail, type Booking, type ConfirmRow } from "./confirm";
import { buildIcs } from "./ics";
import { PHONE } from "./business";

export function confirmationWithCalendar(row: ConfirmRow & { address: string; city: string; zip: string }, id: string, slot: Booking, siteUrl: string) {
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
    ...confirmEmail(row, slot, siteUrl),
    attachments: [{ filename: "visit.ics", content: Buffer.from(ics).toString("base64") }],
  };
}
