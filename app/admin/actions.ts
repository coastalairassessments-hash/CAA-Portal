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
