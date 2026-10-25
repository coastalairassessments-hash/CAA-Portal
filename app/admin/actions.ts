"use server";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await supabaseForUser();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email or password didn't work." };
  redirect("/admin");
}

export async function logout() {
  const supabase = await supabaseForUser();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---- Brick 2: confirm or decline a request ----
import { confirmEmail, declineEmail, parseConfirm } from "@/lib/confirm";
import { sendEmail } from "@/lib/notify";

export type ConfirmState = { error: string | null };

async function adminClient() {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: ok } = await supabase.rpc("is_admin");
  return ok ? supabase : null;
}

const CLIENT_COLUMNS = "name, phone, email, address, city, zip";

export async function confirmRequest(_prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const supabase = await adminClient();
  if (!supabase) return { error: "This account is not on the admin list." };

  const parsed = parseConfirm({
    id: form.get("id"),
    date: form.get("date"),
    time: form.get("time"),
    hours: form.get("hours"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { id, date, time, hours } = parsed.data;

  const { data: client, error: readErr } = await supabase
    .from("requests").select(CLIENT_COLUMNS).eq("id", id).single();
  if (readErr || !client) return { error: "Could not find that request." };

  const { error: saveErr } = await supabase
    .from("requests")
    .update({
      status: "confirmed",
      confirmed_date: date,
      confirmed_time: time,
      block_hours: hours,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (saveErr) return { error: `Could not save. (Ref: confirm-${saveErr.code ?? "unknown"})` };

  const mail = confirmEmail(client, { date, time, hours });
  const sent = await sendEmail({ to: client.email, ...mail });
  if (!sent.ok) console.error(`[confirm] client email not sent: ${sent.reason}`);
  redirect(`/admin/${id}?email=${sent.ok ? "sent" : "failed"}`);
}

export async function declineRequest(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin");

  const { data: client } = await supabase
    .from("requests").select(CLIENT_COLUMNS).eq("id", id).single();
  if (!client) redirect("/admin");

  const { error } = await supabase.from("requests").update({ status: "declined" }).eq("id", id);
  if (error) redirect(`/admin/${id}?error=save`);

  const sent = await sendEmail({ to: client.email, ...declineEmail(client) });
  if (!sent.ok) console.error(`[decline] client email not sent: ${sent.reason}`);
  redirect(`/admin/${id}?email=${sent.ok ? "sent" : "failed"}`);
}
