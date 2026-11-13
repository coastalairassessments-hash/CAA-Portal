import { PHONE, SIGNOFF } from "./business";
import { addDays } from "./dates";

// Friendly nudges for an unpaid final invoice: 3, 7 and 14 days after it was sent. Then we stop.
export const REMINDER_DAYS = [3, 7, 14] as const;

export type OwedRow = {
  status: string;
  email: string | null;
  qb_invoice_id: string | null;
  final_invoiced_at: string | null;
  final_paid_at: string | null;
  invoice_reminders: number | null;
  invoice_reminded_at: string | null;
};

// Returns 1, 2 or 3 (the reminder due now) or null. today is a YYYY-MM-DD New York date.
export function reminderDue(r: OwedRow, today: string): 1 | 2 | 3 | null {
  if (r.status !== "confirmed" || r.final_paid_at || !r.email || !r.qb_invoice_id || !r.final_invoiced_at) return null;
  const sent = r.invoice_reminders ?? 0;
  if (sent >= REMINDER_DAYS.length) return null;
  const invoicedOn = r.final_invoiced_at.slice(0, 10);
  if (today < addDays(invoicedOn, REMINDER_DAYS[sent])) return null;
  // Never two in one day, even if a cron run was missed and we are catching up.
  if (r.invoice_reminded_at && r.invoice_reminded_at.slice(0, 10) === today) return null;
  return (sent + 1) as 1 | 2 | 3;
}

export function invoiceReminderEmail(
  row: { name: string; final_invoice_no?: string | null },
  number: 1 | 2 | 3,
  payLink: string | null,
) {
  const first = row.name.trim().split(/\s+/)[0] || "there";
  const inv = row.final_invoice_no && row.final_invoice_no !== "Card link" ? ` ${row.final_invoice_no}` : "";
  const open = number === 3 ? "Your invoice" + inv + " is still open." : "A quick note: invoice" + inv + " is still open.";
  return {
    subject: number === 1 ? "A reminder about your invoice" : "Your invoice is still open",
    text: [
      `Hi ${first},`,
      "",
      open + " If you already paid, thank you, and please ignore this.",
      "",
      payLink ? `You can pay by card or bank here: ${payLink}` : "You can pay from the invoice email we sent you.",
      "",
      `Something look off, or need another way to pay? Call or text ${PHONE} and we will sort it out.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
  };
}
