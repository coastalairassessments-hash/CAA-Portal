// SERVER ONLY. Creates the final QuickBooks invoice for a job and emails it. Used by the Money drawer and by report upload.
import type { SupabaseClient } from "@supabase/supabase-js";
import { finalInvoice, minutesOnSite } from "./billing";
import { finalInvoicePayload } from "./qbInvoice";
import { createInvoice, emailInvoice, ensureCustomer, ensureServiceItem, qbConnected } from "./qbSync";
import { addDays, todayInNewYork } from "./dates";
import { jobLabel } from "./labels";

export type InvoiceResult = "sent" | "unsent" | "exists" | "qbconnect" | "qb" | "notfound";

export async function createFinalInvoice(supabase: SupabaseClient, id: string): Promise<InvoiceResult> {
  const { data: r } = await supabase.from("requests").select("*").eq("id", id).single();
  if (!r || r.status !== "confirmed") return "notfound";
  if (r.qb_invoice_id) return "exists";
  try {
    if (!(await qbConnected())) return "qbconnect";
    const customerId = r.qb_customer_id || (await ensureCustomer(r));
    const itemId = await ensureServiceItem();
    const inv = finalInvoice({
      issue: r.issue,
      minutes: minutesOnSite(r.arrived_at, r.left_at),
      samples: r.lab_samples,
      extrasCents: r.extras_cents ?? 0,
      depositPaidCents: r.deposit_paid_at && typeof r.deposit_cents === "number" ? r.deposit_cents : null,
    });
    const today = todayInNewYork();
    const payload = finalInvoicePayload({
      customerId,
      itemId,
      service: jobLabel(r),
      inv,
      quarterMinutes: inv.quarters * 15,
      samples: r.lab_samples ?? 0,
      email: r.email,
      txnDate: today,
      dueDate: r.source === "contractor" ? addDays(today, 7) : today,
    });
    const made = await createInvoice(payload);
    const sent = await emailInvoice(made.id, r.email);
    const { error } = await supabase
      .from("requests")
      .update({
        qb_customer_id: customerId,
        qb_invoice_id: made.id,
        final_invoice_no: made.number || r.final_invoice_no,
        final_invoiced_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) console.error("[qb] invoice made but not saved:", error.code);
    return sent ? "sent" : "unsent";
  } catch (e) {
    console.error("[qb] final invoice failed:", e instanceof Error ? e.message : e);
    return "qb";
  }
}
