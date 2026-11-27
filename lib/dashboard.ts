import { addDays, todayInNewYork } from "./dates";
import { finalInvoice, minutesOnSite } from "./billing";
import { depositCents } from "./pricing";
import { needsThanks } from "./referrals";

// Everything the Today dashboard needs, worked out from the jobs. Pure, so it is easy to test.
export type DashRow = {
  id: string;
  status: string;
  source: string;
  booking_mode?: string | null;
  issue: string;
  name: string;
  confirmed_date: string | null;
  confirmed_time: string | null;
  deposit_cents: number | null;
  deposit_paid_at: string | null;
  arrived_at: string | null;
  left_at: string | null;
  lab_samples: number | null;
  extras_cents: number | null;
  trip_only?: boolean | null;
  final_paid_at: string | null;
  final_invoice_no: string | null;
  cancel_refund: boolean | null;
  refunded_at: string | null;
  email_failed_at?: string | null;
  cancel_refund_cents?: number | null;
  referral_code?: string | null;
  referral_thanked_at?: string | null;
};

const easternDay = (iso: string) => todayInNewYork(new Date(iso));

// A finished visit whose final invoice has not been paid.
export const isOwed = (r: DashRow) => r.status === "confirmed" && !!r.left_at && !r.final_paid_at;

// Offered and waiting on Cory to collect. A client paying on their own is handled by the app.
const isWaitingOnDeposit = (r: DashRow) => r.status === "offered" && r.booking_mode !== "instant";

export function needsYou(rows: DashRow[]) {
  return {
    approve: rows.filter((r) => r.status === "new").length,
    deposits: rows.filter(isWaitingOnDeposit).length,
    toInvoice: rows.filter((r) => isOwed(r) && !r.final_invoice_no).length,
    refunds: rows.filter((r) => r.status === "cancelled" && r.cancel_refund && !r.refunded_at).length,
    emails: rows.filter((r) => !!r.email_failed_at && r.status !== "declined").length,
  };
}

export function balanceCents(r: DashRow): number {
  const minutes = minutesOnSite(r.arrived_at, r.left_at);
  const paid = r.source === "client" && r.deposit_paid_at ? (r.deposit_cents ?? depositCents(r.issue)) : null;
  return finalInvoice({
    issue: r.issue,
    minutes,
    samples: r.lab_samples,
    extrasCents: r.extras_cents ?? 0,
    depositPaidCents: paid,
    tripOnly: !!r.trip_only,
  }).balance;
}

export function money(rows: DashRow[], now: Date = new Date()) {
  const today = todayInNewYork(now);
  const month = today.slice(0, 7);

  const depositsWaiting = rows
    .filter(isWaitingOnDeposit)
    .reduce((sum, r) => sum + (r.deposit_cents ?? depositCents(r.issue)), 0);

  const owed = { total: 0, d0to7: 0, d8to14: 0, d15plus: 0 };
  for (const r of rows.filter(isOwed)) {
    const cents = balanceCents(r);
    const age = daysBetween(easternDay(r.left_at!), today);
    owed.total += cents;
    if (age <= 7) owed.d0to7 += cents;
    else if (age <= 14) owed.d8to14 += cents;
    else owed.d15plus += cents;
  }

  const paidThisMonth = rows
    .filter((r) => r.status === "confirmed" && r.final_paid_at && easternDay(r.final_paid_at).startsWith(month))
    .reduce((sum, r) => {
      const minutes = minutesOnSite(r.arrived_at, r.left_at);
      return sum + finalInvoice({ issue: r.issue, minutes, samples: r.lab_samples, extrasCents: r.extras_cents ?? 0, depositPaidCents: null, tripOnly: !!r.trip_only }).total;
    }, 0);

  return { depositsWaiting, owed, paidThisMonth };
}

function daysBetween(from: string, to: string): number {
  let n = 0;
  let d = from;
  while (d < to && n < 3650) {
    d = addDays(d, 1);
    n++;
  }
  return n;
}

// The first job today that has not been finished.
export function nextUp(rows: DashRow[], now: Date = new Date()): DashRow | null {
  const today = todayInNewYork(now);
  return (
    rows
      .filter((r) => r.status === "confirmed" && r.confirmed_date === today && !r.left_at)
      .sort((a, b) => (a.confirmed_time ?? "").localeCompare(b.confirmed_time ?? ""))[0] ?? null
  );
}

// The money still to send back on cancelled bookings. A booking with no recorded amount counts its deposit.
export function refundsDueCents(rows: DashRow[]): number {
  return rows
    .filter((r) => r.status === "cancelled" && r.cancel_refund && !r.refunded_at)
    .reduce((sum, r) => sum + (r.cancel_refund_cents ?? r.deposit_cents ?? depositCents(r.issue)), 0);
}

// Where every job stands, in the order work moves. Each job falls in at most one step.
export function pipeline(rows: DashRow[]) {
  const live = rows.filter((r) => r.status !== "cancelled" && r.status !== "declined");
  return {
    new: live.filter((r) => r.status === "new").length,
    waitingDeposit: live.filter((r) => r.status === "offered").length,
    booked: live.filter((r) => r.status === "confirmed" && !r.left_at).length,
    toInvoice: live.filter((r) => isOwed(r) && !r.final_invoice_no).length,
    awaitingPayment: live.filter((r) => isOwed(r) && !!r.final_invoice_no).length,
    paid: live.filter((r) => r.status === "confirmed" && !!r.final_paid_at).length,
  };
}

// Paid jobs that a partner sent and nobody has thanked yet.
export const referrersToThank = (rows: DashRow[]): number => rows.filter(needsThanks).length;
