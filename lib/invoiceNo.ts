// Invoice number and due date for a job. Worked out from the job, so nothing extra is stored. Pure.
import { addDays, todayInNewYork } from "./dates";

export const invoiceNumber = (r: { id: string; confirmed_date?: string | null }) =>
  `CAA-${(r.confirmed_date ?? "").replace(/-/g, "")}-${r.id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;

// Contractors pay within 7 days of the invoice. Homeowners pay on receipt.
export function dueDate(r: { source?: string | null; final_invoiced_at?: string | null }): string {
  const sent = r.final_invoiced_at ? todayInNewYork(new Date(r.final_invoiced_at)) : todayInNewYork();
  return r.source === "contractor" ? addDays(sent, 7) : sent;
}
