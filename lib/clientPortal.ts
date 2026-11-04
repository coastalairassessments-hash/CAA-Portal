// What one line of a client's portal says about a job. Pure, so it is easy to test.
import { formatDateLabel } from "./dates";
import { formatTime, issueLabel } from "./labels";
import { reportState, type ReportState } from "./report";

export type PortalJob = {
  id: string;
  public_token: string | null;
  status: string;
  issue: string;
  address: string;
  confirmed_date: string | null;
  confirmed_time: string | null;
  preferred_date: string | null;
  left_at?: string | null;
  report_path?: string | null;
  final_paid_at?: string | null;
  report_released_at?: string | null;
};

export function statusLabel(r: Pick<PortalJob, "status" | "left_at" | "final_paid_at">): string {
  switch (r.status) {
    case "new": return "Request received";
    case "offered": return "Waiting on deposit";
    case "confirmed":
      if (r.final_paid_at) return "Paid";
      return r.left_at ? "Visit done" : "Booked";
    case "cancelled": return "Cancelled";
    default: return "In progress";
  }
}

export function portalRow(r: PortalJob): { id: string; title: string; address: string; when: string; status: string; report: ReportState; bookingPath: string | null } {
  const date = r.confirmed_date ?? r.preferred_date;
  const time = r.confirmed_time ? ` at ${formatTime(r.confirmed_time.slice(0, 5))}` : "";
  return {
    id: r.id,
    title: issueLabel(r.issue),
    address: r.address,
    when: date ? `${formatDateLabel(date)}${time}` : "",
    status: statusLabel(r),
    report: reportState(r),
    bookingPath: r.public_token ? `/booking/${r.public_token}` : null,
  };
}
