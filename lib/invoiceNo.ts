// Invoice number and due date for a job. Worked out from the job, so nothing extra is stored. Pure.
import { addDays, todayInNewYork } from "./dates";
import { NET_DAYS } from "./contractorTerms";

export const invoiceNumber = (r: { id: string; confirmed_date?: string | null }) =>
  `CAA-${(r.confirmed_date ?? "").replace(/-/g, "")}-${r.id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;

// Contractors pay within 15 days of the invoice, except a trip fee, which is due on receipt. Homeowners pay on receipt.
export function dueDate(r: { source?: string | null; final_invoiced_at?: string | null; trip_only?: boolean | null }): string {
  const sent = r.final_invoiced_at ? todayInNewYork(new Date(r.final_invoiced_at)) : todayInNewYork();
  return r.source === "contractor" && !r.trip_only ? addDays(sent, NET_DAYS) : sent;
}
