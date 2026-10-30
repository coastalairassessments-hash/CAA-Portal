// What a client sees on their booking page, worked out from the job. Pure, so it is easy to test.
import { formatDateLabel } from "./dates";
import { formatTime } from "./labels";
import { depositCents, formatMoney } from "./pricing";
import { refundDue } from "./cancel";
import { REPLY_PROMISE } from "./business";

export type BookingRow = {
  status: string;
  issue: string;
  preferred_date: string;
  preferred_time: string;
  confirmed_date: string | null;
  confirmed_time: string | null;
  deposit_cents: number | null;
  left_at: string | null;
  final_paid_at: string | null;
};

export const CLIENT_STEPS = ["Requested", "Time confirmed", "Deposit paid", "Visit done", "Paid"] as const;

export function clientStep(r: BookingRow): number {
  if (r.status === "cancelled" || r.status === "declined") return 0;
  if (r.final_paid_at) return 5;
  if (r.left_at) return 4;
  if (r.status === "confirmed") return 3;
  if (r.status === "offered") return 2;
  return 1;
}

export function bookingView(r: BookingRow, now: Date = new Date()) {
  const date = r.confirmed_date ?? r.preferred_date;
  const time = (r.confirmed_time ?? r.preferred_time).slice(0, 5);
  const when = `${formatDateLabel(date)} at ${formatTime(time)}`;
  const deposit = formatMoney(r.deposit_cents ?? depositCents(r.issue));
  const active = ["new", "offered", "confirmed"].includes(r.status) && !r.left_at;

  let headline = "";
  let detail = "";
  if (r.status === "new") {
    headline = "We received your request";
    detail = `You asked for ${when}. ${REPLY_PROMISE} There is nothing to pay yet.`;
  } else if (r.status === "offered") {
    headline = `Your time: ${when}`;
    detail = `A ${deposit} deposit holds it. We send a secure deposit link by email. If two people ask for the same time, the first deposit gets it.`;
  } else if (r.status === "confirmed" && !r.left_at) {
    headline = `You are booked: ${when}`;
    detail = "Your deposit is received. We will see you then.";
  } else if (r.status === "confirmed") {
    headline = "Your visit is done";
    detail = r.final_paid_at ? "Thank you. Your final invoice is paid." : "Your final invoice and report follow. The report is released after the final payment.";
  } else if (r.status === "cancelled") {
    headline = "This booking is cancelled";
    detail = "To book another day, request a new date.";
  } else {
    headline = "We could not schedule this request";
    detail = "Request another date, or call or text us.";
  }

  let cancelNote = "";
  if (active) {
    if (r.status === "confirmed") {
      cancelNote = refundDue(date, time, now)
        ? "Cancel now and your deposit is refunded in full."
        : "This is within 24 hours of the visit, so the deposit is not refunded.";
    } else {
      cancelNote = "No deposit has been paid, so there is nothing to refund.";
    }
  }
  return { when, headline, detail, canCancel: active, cancelNote, step: clientStep(r) };
}
