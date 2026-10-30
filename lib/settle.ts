// SERVER ONLY. Notices that a client paid their deposit, and books the time. Safe to run again and again.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getInvoice, voidInvoice } from "./qbSync";
import { sendEmail, SITE_URL_FALLBACK } from "./notify";
import { sendPush } from "./push";
import { bookedPush, refundPush } from "./pushText";
import { takenPaidEmail } from "./confirm";
import { confirmationWithCalendar } from "./confirmMail";
import { formatDateLabel } from "./dates";
import { formatTime } from "./labels";
import { holdAbandoned } from "./instant";

const EXCLUSION_VIOLATION = "23P01";
const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export const SETTLE_COLUMNS =
  "id, status, booking_mode, offered_at, qb_deposit_invoice_id, name, email, phone, address, city, zip, public_token, confirmed_date, confirmed_time, block_hours";

type Row = {
  id: string; status: string; booking_mode: string | null; offered_at: string | null; qb_deposit_invoice_id: string | null;
  name: string; email: string; phone: string; address: string; city: string; zip: string; public_token: string | null;
  confirmed_date: string | null; confirmed_time: string | null; block_hours: number | null;
};

export type SettleResult = "paid" | "waiting" | "taken" | "abandoned" | "skip";

export async function settleDeposit(db: SupabaseClient, r: Row, now: Date = new Date()): Promise<SettleResult> {
  if (r.status !== "offered" || r.booking_mode !== "instant" || !r.qb_deposit_invoice_id) return "skip";
  if (!r.confirmed_date || !r.confirmed_time || !r.block_hours) return "skip";

  const inv = await getInvoice(r.qb_deposit_invoice_id).catch(() => null);
  if (!inv) return "waiting";

  if (inv.balance > 0) {
    // Never paid and well past the hold: free the time and close the invoice.
    if (holdAbandoned(r, now)) {
      const { data } = await db.from("requests").update({ status: "cancelled", cancel_refund: false }).eq("id", r.id).eq("status", "offered").select("id");
      if (data?.length) await voidInvoice(r.qb_deposit_invoice_id);
      return "abandoned";
    }
    return "waiting";
  }

  const slot = { date: r.confirmed_date, time: String(r.confirmed_time).slice(0, 5), hours: r.block_hours };
  const paidAt = now.toISOString();
  const { data, error } = await db
    .from("requests")
    .update({ status: "confirmed", deposit_paid_at: paidAt })
    .eq("id", r.id)
    .eq("status", "offered")
    .select("id");

  if (error?.code === EXCLUSION_VIOLATION) {
    // Paid after the hold ended, and someone else took the time. Refund them in full.
    const { data: moved } = await db
      .from("requests")
      .update({ status: "cancelled", cancel_refund: true, deposit_paid_at: paidAt })
      .eq("id", r.id).eq("status", "offered").select("id");
    if (moved?.length) {
      await sendEmail({ to: r.email, ...takenPaidEmail(r, slot) });
      await sendPush(refundPush(r));
    }
    return "taken";
  }
  if (error) {
    console.error("[settle] could not book:", error.code);
    return "waiting";
  }
  if (!data?.length) return "skip"; // someone else already settled it

  const site = clean(process.env.SITE_URL) || SITE_URL_FALLBACK;
  const sent = await sendEmail({ to: r.email, ...confirmationWithCalendar(r, r.id, slot, site) });
  if (!sent.ok) console.error(`[settle] confirmation not sent: ${sent.reason}`);
  await sendPush(bookedPush(r, `${formatDateLabel(slot.date)} at ${formatTime(slot.time)}`));
  return "paid";
}
