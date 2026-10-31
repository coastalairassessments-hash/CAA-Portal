import { formatDateLabel } from "./dates";
import { formatTime } from "./labels";

// Where a job is in its life, for the progress strip on the job screen.
export type StageRow = {
  status: string;
  source: string;
  left_at: string | null;
  final_invoice_no: string | null;
  final_paid_at: string | null;
};

export const STAGES = ["Requested", "Booked", "Visited", "Invoiced", "Paid"] as const;

// How many steps are done (0 to 5). Cancelled and declined jobs show nothing.
export function stageDone(r: StageRow): number {
  if (r.status === "cancelled" || r.status === "declined") return 0;
  if (r.final_paid_at) return 5;
  if (r.final_invoice_no) return 4;
  if (r.left_at) return 3;
  if (r.status === "confirmed") return 2;
  return 1;
}

// One line per client: where they are right now, and whether it needs Cory.
export type ProgressRow = Pick<StageRow, "status" | "source"> & {
  left_at?: string | null;
  final_invoice_no?: string | null;
  final_paid_at?: string | null;
  created_at: string;
  booking_mode?: string | null;
  preferred_date?: string | null;
  confirmed_date: string | null;
  confirmed_time: string | null;
  en_route_at?: string | null;
  arrived_at?: string | null;
  cancel_refund?: boolean | null;
  refunded_at?: string | null;
};
export type Progress = { label: string; note: string; warn: boolean; alive: boolean };

export function ago(iso: string, now: Date): string {
  const mins = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60000));
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)} hr ago`;
  const d = Math.floor(mins / 1440);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}

export function progress(r: ProgressRow, today: string, now: Date = new Date()): Progress {
  const when = r.confirmed_date ? `${formatDateLabel(r.confirmed_date)}${r.confirmed_time ? ` at ${formatTime(r.confirmed_time)}` : ""}` : "";
  switch (r.status) {
    case "new":
      return { label: "New request", note: r.preferred_date ? `Wants ${formatDateLabel(r.preferred_date)}` : `Sent ${ago(r.created_at, now)}`, warn: true, alive: true };
    case "offered":
      return r.booking_mode === "instant"
        ? { label: "Paying deposit", note: `Started ${ago(r.created_at, now)}`, warn: false, alive: true }
        : { label: "Deposit waiting", note: when || `Offered ${ago(r.created_at, now)}`, warn: true, alive: true };
    case "confirmed": {
      if (r.final_paid_at) return { label: "Paid", note: "", warn: false, alive: false };
      if (r.left_at) {
        const days = Math.floor((now.getTime() - new Date(r.left_at).getTime()) / 86400000);
        const note = days < 1 ? "Visit finished today" : `${days} ${days === 1 ? "day" : "days"} since the visit`;
        return r.final_invoice_no
          ? { label: "Invoiced, unpaid", note, warn: days >= 7, alive: true }
          : { label: "Send invoice", note, warn: true, alive: true };
      }
      if (r.arrived_at) return { label: "On site", note: "", warn: false, alive: true };
      if (r.en_route_at) return { label: "On the way", note: "", warn: false, alive: true };
      if (r.confirmed_date === today) return { label: "Today", note: r.confirmed_time ? formatTime(r.confirmed_time) : "", warn: false, alive: true };
      return { label: "Booked", note: when, warn: false, alive: true };
    }
    case "cancelled":
      return r.cancel_refund && !r.refunded_at
        ? { label: "Refund due", note: "", warn: true, alive: true }
        : { label: "Cancelled", note: "", warn: false, alive: false };
    case "declined":
      return { label: "Declined", note: "", warn: false, alive: false };
    default:
      return { label: r.status, note: "", warn: false, alive: false };
  }
}
