"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseForUser } from "@/lib/supabase/server";
import { serviceDb } from "@/lib/bookingServer";
import { parseEmail } from "@/lib/contractorAuth";
import { sendLoginLink } from "@/lib/contractorServer";

async function adminClient() {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: ok } = await supabase.rpc("is_admin");
  return ok ? supabase : null;
}
const validId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);
const back = (flag: string) => redirect(`/admin/contractors?${flag}=1`);

// Save a contractor's email and phone so they can sign in. A new name makes a new contractor.
export async function saveContractor(form: FormData): Promise<void> {
  const supabase = await adminClient();
  if (!supabase) redirect("/admin");
  const id = String(form.get("id") ?? "");
  const email = parseEmail(form.get("email"));
  const name = z.string().trim().min(1).max(100).safeParse(form.get("name"));
  const phone = String(form.get("phone") ?? "").trim().slice(0, 40) || null;
  if (!email.success) return back("error");
  const fields = { email: email.data, phone, portal_active: true };
  const { error } = id
    ? validId(id) ? await supabase.from("contractors").update(fields).eq("id", id) : { error: new Error("bad id") }
    : name.success ? await supabase.from("contractors").insert({ name: name.data, ...fields }) : { error: new Error("no name") };
  back(error ? "error" : "saved");
}

export async function setPortalAccess(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !validId(id)) redirect("/admin");
  const { error } = await supabase.from("contractors").update({ portal_active: form.get("on") === "1" }).eq("id", id);
  back(error ? "error" : "saved");
}

// Emails the contractor a fresh sign-in link, for when they say they cannot get in.
export async function sendLink(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !validId(id)) redirect("/admin");
  const { data: c } = await supabase.from("contractors").select("email").eq("id", id).maybeSingle();
  const db = serviceDb();
  if (db && c?.email) await sendLoginLink(db, c.email).catch(() => undefined);
  back("link");
}
