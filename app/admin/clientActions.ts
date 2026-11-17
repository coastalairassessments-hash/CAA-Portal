"use server";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { cleanEmail, cleanPhone } from "@/lib/clientImport";

export type ClientState = { error: string | null };

// Save a person to the client list without a job. Admin only (the database rules check it too).
export async function addClient(_prev: ClientState, form: FormData): Promise<ClientState> {
  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { error: "This account is not on the admin list." };

  const name = String(form.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 200);
  const phoneRaw = String(form.get("phone") ?? "").trim();
  const emailRaw = String(form.get("email") ?? "").trim();
  const address = String(form.get("address") ?? "").trim().slice(0, 200) || null;
  const notes = String(form.get("notes") ?? "").trim().slice(0, 1000) || null;
  if (name.length < 2) return { error: "Enter the client's name." };
  const ph = phoneRaw ? cleanPhone(phoneRaw) : null;
  if (phoneRaw && !ph) return { error: "Enter a 10 digit phone number." };
  const email = emailRaw ? cleanEmail(emailRaw) : null;
  if (emailRaw && !email) return { error: "Enter a valid email." };

  const key = `${name.toLowerCase()}|${email ?? ph?.digits ?? ""}`;
  const { error } = await supabase.from("clients").insert({ key, name, phone: ph?.phone ?? null, phone_digits: ph?.digits ?? null, email, address, notes, source: "app" });
  if (error) return { error: error.code === "23505" ? "That client is already on your list." : `Could not save. (Ref: client-${error.code ?? "unknown"})` };
  redirect(`/admin/clients?q=${encodeURIComponent(name)}`);
}
