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
