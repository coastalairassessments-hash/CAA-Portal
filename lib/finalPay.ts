// SERVER ONLY. The balance after a visit, paid by card on a Stripe page.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCheckout, isStripeId } from "./stripePay";
import { sendReadyReports } from "./reportServer";
import { sendEmail, SITE_URL_FALLBACK } from "./notify";
import { GOOGLE_REVIEW_URL, reviewEmail } from "./quicktexts";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();
export const siteBase = () => (clean(process.env.SITE_URL) || SITE_URL_FALLBACK).replace(/\/+$/, "");

// The one link a client uses for their balance. It always works, even after Stripe's page times out.
export const balanceLink = (token: string | null | undefined, fallback: string) =>
  token ? `${siteBase()}/booking/${token}/balance` : fallback;

type Row = { id: string; name: string; email: string; source: string | null; public_token: string | null; qb_invoice_id: string | null; final_paid_at: string | null };

// If the balance was paid, record it, release the report, and thank the client. Safe to run again and again.
export async function settleFinalPayment(db: SupabaseClient, r: Row): Promise<boolean> {
  if (r.final_paid_at || !isStripeId(r.qb_invoice_id)) return false;
  const s = await getCheckout(r.qb_invoice_id!).catch(() => null);
  if (!s?.paid) return false;
  const { data } = await db
    .from("requests")
    .update({ final_paid_at: new Date().toISOString(), payment_method: "card" })
    .eq("id", r.id)
    .is("final_paid_at", null)
    .select("id");
  if (!data?.length) return false; // someone else already recorded it
  await sendReadyReports(db, r.id).catch(() => 0);
  if (r.source === "client" && r.email && GOOGLE_REVIEW_URL) {
    const sent = await sendEmail({ to: r.email, ...reviewEmail(r, GOOGLE_REVIEW_URL, siteBase()) });
    if (!sent.ok) console.error(`[review] email not sent: ${sent.reason}`);
  }
  return true;
}
