// SERVER ONLY. Notices that a client paid their final invoice, marks the job paid, and sends the report.
// Safe to run again and again: a job is marked paid once, and each email is sent once.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getInvoice } from "./qbSync";
import { sendReadyReports } from "./reportServer";
import { GOOGLE_REVIEW_URL, reviewEmail } from "./quicktexts";
import { SITE_URL_FALLBACK, sendEmail } from "./notify";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export type FinalResult = "paid" | "waiting" | "skip";

type Row = { id: string; name: string; email: string | null; source: string | null; qb_invoice_id: string | null; final_paid_at: string | null };

export async function settleFinal(db: SupabaseClient, r: Row): Promise<FinalResult> {
  if (!r.qb_invoice_id || r.final_paid_at) return "skip";
  const inv = await getInvoice(r.qb_invoice_id).catch(() => null);
  if (!inv || inv.balance > 0) return "waiting";

  // Only the run that flips final_paid_at from empty to set carries on, so nothing is sent twice.
  const { data } = await db
    .from("requests")
    .update({ final_paid_at: new Date().toISOString() })
    .eq("id", r.id)
    .is("final_paid_at", null)
    .select("id");
  if (!data?.length) return "skip";

  await sendReadyReports(db, r.id).catch(() => 0);
  if (r.source === "client" && r.email && GOOGLE_REVIEW_URL) {
    const site = clean(process.env.SITE_URL) || SITE_URL_FALLBACK;
    const sent = await sendEmail({ to: r.email, ...reviewEmail(r, GOOGLE_REVIEW_URL, site) });
    if (!sent.ok) console.error(`[review] email not sent: ${sent.reason}`);
  }
  return "paid";
}

export async function settleAllFinals(db: SupabaseClient): Promise<Record<string, number>> {
  const { data } = await db
    .from("requests")
    .select("id, name, email, source, qb_invoice_id, final_paid_at")
    .eq("status", "confirmed")
    .not("qb_invoice_id", "is", null)
    .is("final_paid_at", null)
    .limit(100);
  const tally: Record<string, number> = {};
  for (const row of data ?? []) {
    const r = await settleFinal(db, row).catch((e) => {
      console.error("[final] settle failed:", e instanceof Error ? e.message : e);
      return "waiting" as const;
    });
    tally[r] = (tally[r] ?? 0) + 1;
  }
  return tally;
}
