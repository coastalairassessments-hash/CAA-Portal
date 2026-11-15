// The billing terms a contractor agrees to. Wording change = new version, so each acceptance stays tied to
// the text that contractor saw. Keep the numbers here only: invoices, emails and the fee run off them.
import { TRIP_FEE_CENTS } from "./charges";

export const CONTRACTOR_TERMS_VERSION = "c1-2026-11";
export const CONTRACTOR_TERMS_TITLE = "Contractor Billing Terms";
export const NET_DAYS = 15;
export const LATE_FEE_AFTER_DAYS = 30;
export const REMINDER_AFTER_DAYS = 25;
export const LATE_FEE_CENTS = 25000;
export const LATE_FEE_LABEL = "Administrative fee (invoice unpaid after 30 days)";

const dollars = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export const CONTRACTOR_TERMS_INTRO =
  "These terms apply to every job Coastal Air Assessments does at your request. They cover how and when you are invoiced.";

export const CONTRACTOR_TERMS: { n: number; title: string; text: string }[] = [
  { n: 1, title: "Invoices", text: `We invoice after the visit. Each invoice is due ${NET_DAYS} days after the invoice date and can be paid by card from the link on the invoice.` },
  { n: 2, title: "Administrative fee", text: `If an invoice is unpaid ${LATE_FEE_AFTER_DAYS} days after the invoice date, an administrative fee of ${dollars(LATE_FEE_CENTS)} is added to that invoice. We email a reminder ${LATE_FEE_AFTER_DAYS - REMINDER_AFTER_DAYS} days before the fee is added.` },
  { n: 3, title: "Trip fees", text: `If we arrive and cannot do the work, for example the area is not ready, there is no access, or containment has been breached, a trip fee of ${dollars(TRIP_FEE_CENTS)} is billed instead. A trip fee is due on receipt and must be paid before our next scheduled visit for you.` },
  { n: 4, title: "Agreement", text: "You agree to these terms when you accept them, or when you request work from us after receiving them. We keep the date and version you accepted." },
];

// A one-line reminder printed on every contractor invoice.
export const CONTRACTOR_INVOICE_LINE = `Due ${NET_DAYS} days from the invoice date. A ${dollars(LATE_FEE_CENTS)} administrative fee is added to invoices unpaid after ${LATE_FEE_AFTER_DAYS} days.`;
export const TRIP_INVOICE_LINE = "Trip fee due on receipt, and before our next scheduled visit.";

const dayNumber = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
};
export const daysBetween = (from: string, to: string) => dayNumber(to) - dayNumber(from);

// What the daily check should do for an unpaid contractor invoice.
export function feeStage(invoicedOn: string, today: string): "none" | "remind" | "fee" {
  const days = daysBetween(invoicedOn, today);
  if (days > LATE_FEE_AFTER_DAYS) return "fee";
  if (days >= REMINDER_AFTER_DAYS) return "remind";
  return "none";
}
