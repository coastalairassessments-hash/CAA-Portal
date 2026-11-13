"use server";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { parseCharge } from "@/lib/charges";
import { preserveLegacy, syncExtras } from "@/lib/chargeServer";

async function adminClient() {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: ok } = await supabase.rpc("is_admin");
  return ok ? supabase : null;
}
const validId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);
const done = (id: string, error?: string) => redirect(`/admin/${id}${error ? `?error=charge&why=${encodeURIComponent(error)}` : "?saved=charges"}#money`);

export async function addCharge(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !validId(id)) redirect("/admin");
  const parsed = parseCharge({
    id,
    preset: form.get("preset"),
    qty: form.get("qty") ?? "",
    description: form.get("description") ?? "",
    price: form.get("price") ?? "",
  });
  if (!parsed.success) return done(id, parsed.error.issues[0]?.message ?? "Check the charge");
  const { data: job } = await supabase.from("requests").select("final_paid_at").eq("id", id).single();
  if (job?.final_paid_at) return done(id, "This job is already paid");
  await preserveLegacy(supabase, id);
  const { id: _id, ...row } = parsed.data; // eslint-disable-line @typescript-eslint/no-unused-vars
  const { error } = await supabase.from("job_charges").insert({ request_id: id, ...row });
  if (error) return done(id, "That did not save");
  await syncExtras(supabase, id);
  done(id);
}

export async function deleteCharge(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  const row = String(form.get("row") ?? "");
  if (!supabase || !validId(id) || !validId(row)) redirect("/admin");
  const { data: job } = await supabase.from("requests").select("final_paid_at").eq("id", id).single();
  if (job?.final_paid_at) return done(id, "This job is already paid");
  await supabase.from("job_charges").delete().eq("id", row).eq("request_id", id);
  await syncExtras(supabase, id);
  done(id);
}
