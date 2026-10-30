// What a client sees on their booking page, worked out from the job. Pure, so it is easy to test.
import { formatDateLabel } from "./dates";
import { formatTime } from "./labels";
import { depositCents, formatMoney } from "./pricing";
import { refundDue } from "./cancel";
import { REPLY_PROMISE } from "./business";
import { holdActive, holdEndsAt } from "./instant";

export type BookingRow = {
  status: string;
  issue: string;
  preferred_date: string;
  preferred_time: string;
  confirmed_date: string | null;
  confirmed_time: string | null;
  deposit_cents: number | null;
  booking_mode?: string | null;
  offered_at?: string | null;
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
  } else if (r.status === "offered" && r.booking_mode === "instant") {
    if (holdActive(r, now)) {
      const until = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }).format(holdEndsAt(r.offered_at!));
      headline = `Pay your deposit to hold ${when}`;
      detail = `Your time is held until ${until}. The ${deposit} deposit locks it in, and you are booked the moment it is paid.`;
    } else {
      headline = "Your hold ended";
      detail = `${when} was held for you while you paid. If you already paid, this page updates in a moment. Otherwise, request that time again.`;
    }
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
  const paying = r.status === "offered" && r.booking_mode === "instant" && holdActive(r, now);
  return { when, headline, detail, canCancel: active, cancelNote, step: clientStep(r), paying, expired: r.status === "offered" && r.booking_mode === "instant" && !paying };
}
