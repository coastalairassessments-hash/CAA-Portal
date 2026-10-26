// SERVER ONLY. True only for the signed-in admin (same check the admin pages use).
import { supabaseForUser } from "./supabase/server";

export async function isAdminUser(): Promise<boolean> {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const { data: ok } = await supabase.rpc("is_admin");
  return ok === true;
}
