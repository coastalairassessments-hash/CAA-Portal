"use server";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { makeCode, parsePartner, parseRefCode } from "@/lib/referrals";

async function adminClient() {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: ok } = await supabase.rpc("is_admin");
  return ok ? supabase : null;
}

export async function addPartner(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const parsed = parsePartner({ name: form.get("name"), kind: form.get("kind") });
  if (!supabase || !parsed.success) redirect("/admin/referrals?error=1");
  const { data: all } = await supabase.from("referral_partners").select("code").limit(1000);
  const code = makeCode(parsed.data.name, (all ?? []).map((p) => p.code));
  const { error } = await supabase.from("referral_partners").insert({ name: parsed.data.name, kind: parsed.data.kind, code });
  redirect(error ? "/admin/referrals?error=1" : "/admin/referrals?added=1");
}

export async function deletePartner(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/referrals");
  await supabase.from("referral_partners").delete().eq("id", id);
  redirect("/admin/referrals");
}

// Tag a phone-booked job with who sent it. An empty choice clears it.
export async function setJobReferral(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin");
  const raw = String(form.get("code") ?? "");
  const code = raw === "" ? null : parseRefCode(raw);
  if (raw !== "" && !code) redirect(`/admin/${id}?error=save`);
  const { error } = await supabase.from("requests").update({ referral_code: code }).eq("id", id);
  redirect(`/admin/${id}${error ? "?error=save" : "?saved=referral"}`);
}
