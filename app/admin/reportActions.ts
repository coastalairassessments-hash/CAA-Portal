"use server";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { serviceDb } from "@/lib/bookingServer";
import { MAX_REPORT_BYTES, REPORT_BUCKET, looksLikePdf, reportPath, validReportPath } from "@/lib/report";
import { sendReadyReports } from "@/lib/reportServer";

async function adminClient() {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: ok } = await supabase.rpc("is_admin");
  return ok ? supabase : null;
}
const validId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);
const back = (id: string, flag: string) => redirect(`/admin/${id}?report=${flag}#report`);

// Attach the finished PDF. A new upload replaces the old one and the client is told once it is unlocked.
export async function uploadReport(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  const file = form.get("report");
  if (!supabase || !validId(id)) redirect("/admin");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_REPORT_BYTES) return back(id, "size");
  if (!looksLikePdf(new Uint8Array(await file.slice(0, 8).arrayBuffer()))) return back(id, "type");

  const { data: old } = await supabase.from("requests").select("report_path").eq("id", id).maybeSingle();
  const path = reportPath(id);
  const up = await supabase.storage.from(REPORT_BUCKET).upload(path, file, { contentType: "application/pdf", upsert: false });
  if (up.error) return back(id, "error");
  const { error } = await supabase
    .from("requests")
    .update({ report_path: path, report_uploaded_at: new Date().toISOString(), report_emailed_at: null })
    .eq("id", id);
  if (error) {
    await supabase.storage.from(REPORT_BUCKET).remove([path]);
    return back(id, "error");
  }
  if (old?.report_path && validReportPath(id, old.report_path)) await supabase.storage.from(REPORT_BUCKET).remove([old.report_path]);
  const db = serviceDb();
  if (db) await sendReadyReports(db, id).catch(() => 0);
  back(id, "saved");
}

// Unlock early, for a contractor on terms or as goodwill.
export async function releaseReport(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !validId(id)) redirect("/admin");
  const { error } = await supabase.from("requests").update({ report_released_at: new Date().toISOString() }).eq("id", id);
  if (error) return back(id, "error");
  const db = serviceDb();
  if (db) await sendReadyReports(db, id).catch(() => 0);
  back(id, "released");
}

export async function removeReport(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !validId(id)) redirect("/admin");
  const { data: row } = await supabase.from("requests").select("report_path").eq("id", id).maybeSingle();
  if (row?.report_path && validReportPath(id, row.report_path)) await supabase.storage.from(REPORT_BUCKET).remove([row.report_path]);
  await supabase
    .from("requests")
    .update({ report_path: null, report_uploaded_at: null, report_released_at: null, report_emailed_at: null })
    .eq("id", id);
  back(id, "removed");
}
