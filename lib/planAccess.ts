// While the control plan is a draft, only a signed-in admin can open it.
import { supabaseForUser } from "@/lib/supabase/server";

export async function isAdminUser(): Promise<boolean> {
  const supabase = await supabaseForUser();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  return !!(await supabase.rpc("is_admin")).data;
}
