// One gentle email when a requested time has gone a day without a deposit. Nothing is scheduled until the deposit arrives.
import { PHONE, SIGNOFF } from "./business";
import { bookingLine } from "./links";
import { formatDateLabel } from "./dates";
import { formatTime } from "./labels";

export const NUDGE_AFTER_HOURS = 24;

export type NudgeRow = {
  status: string;
  booking_mode?: string | null;
  offered_at?: string | null;
  deposit_reminded_at?: string | null;
  email?: string | null;
  qb_deposit_invoice_id?: string | null;
  confirmed_date?: string | null;
  confirmed_time?: string | null;
};

export function depositNudgeDue(r: NudgeRow, now: Date = new Date()): boolean {
  if (r.status !== "offered" || r.booking_mode === "instant" || r.deposit_reminded_at) return false;
  if (!r.email || !r.qb_deposit_invoice_id || !r.offered_at || !r.confirmed_date || !r.confirmed_time) return false;
  const hours = (now.getTime() - new Date(r.offered_at).getTime()) / 3_600_000;
  return hours >= NUDGE_AFTER_HOURS;
}

export function depositNudgeEmail(row: { name: string; public_token?: string | null; confirmed_date: string; confirmed_time: string }, siteUrl: string) {
  const first = row.name.trim().split(/\s+/)[0] || "there";
  const when = `${formatDateLabel(row.confirmed_date)} at ${formatTime(row.confirmed_time.slice(0, 5))}`;
  return {
    subject: "Finish booking your visit",
    text: [
      `Hi ${first},`,
      "",
      `You asked for ${when}. It is not on our schedule yet. Your visit is scheduled once your deposit is received, and the first deposit holds the date.`,
      "",
      ...bookingLine(row, siteUrl, "Pay your deposit to book it"),
      `If another day works better, reply to this email or call or text ${PHONE}.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
  };
}
