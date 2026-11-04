// SERVER ONLY. Tells clients their report is ready, once. Safe to run again: report_emailed_at is the memory.
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL_FALLBACK } from "./notify";
import { sendLogged } from "./mailLog";
import { reportLockedEmail, reportReadyEmail, reportState } from "./report";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export async function sendReadyReports(db: SupabaseClient, onlyId?: string) {
  const site = clean(process.env.SITE_URL) || SITE_URL_FALLBACK;
  let q = db
    .from("requests")
    .select("id, name, email, public_token, source, report_path, final_paid_at, report_released_at")
    .not("report_path", "is", null)
    .is("report_emailed_at", null)
    .eq("source", "client");
  if (onlyId) q = q.eq("id", onlyId);
  const { data } = await q.limit(50);
  let count = 0;
  for (const r of data ?? []) {
    if (!r.email || reportState(r) !== "ready") continue;
    const res = await sendLogged(db, r.id, { to: r.email, ...reportReadyEmail(r, site) });
    if (!res.ok) continue;
    await db.from("requests").update({ report_emailed_at: new Date().toISOString() }).eq("id", r.id);
    count++;
  }
  return count;
}

// One-time "your report is ready, pay to unlock it" note. report_locked_emailed_at is the memory.
export async function sendLockedNotice(db: SupabaseClient, id: string) {
  const site = clean(process.env.SITE_URL) || SITE_URL_FALLBACK;
  const { data: r } = await db
    .from("requests")
    .select("id, name, email, public_token, source, report_path, final_paid_at, report_released_at, report_locked_emailed_at")
    .eq("id", id)
    .maybeSingle();
  if (!r || !r.email || r.source !== "client" || r.report_locked_emailed_at || reportState(r) !== "locked") return false;
  const res = await sendLogged(db, r.id, { to: r.email, ...reportLockedEmail(r, site) });
  if (!res.ok) return false;
  await db.from("requests").update({ report_locked_emailed_at: new Date().toISOString() }).eq("id", r.id);
  return true;
}
