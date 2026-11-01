"use server";
import { supabaseForUser } from "@/lib/supabase/server";
import { sendEmail, SITE_URL_FALLBACK } from "@/lib/notify";
import { enRouteEmail } from "@/lib/enroute";
import { acceptableAt, isStampKind } from "@/lib/stampQueue";

// Saves a tap that was made earlier, possibly with no signal. It only fills an empty stamp, so a late
// retry can never overwrite one that is already there. The first tap time wins.
export async function syncStamp(input: { id: string; which: string; at: string }): Promise<{ ok: boolean }> {
  const { id, which, at } = input;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !isStampKind(which) || !acceptableAt(at)) return { ok: false };
  const supabase = await supabaseForUser();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false };
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) return { ok: false };

  const { data: updated, error } = await supabase
    .from("requests")
    .update({ [which]: new Date(at).toISOString() })
    .eq("id", id)
    .is(which, null)
    .select("name, email, source, public_token")
    .maybeSingle();
  if (error) return { ok: false };
  // "On my way" tells the client once, with their live link, the same as a normal tap.
  if (updated && which === "en_route_at" && updated.source === "client" && updated.email) {
    await sendEmail({ to: updated.email, ...enRouteEmail(updated, (process.env.SITE_URL?.trim() || SITE_URL_FALLBACK)) }).catch(() => undefined);
  }
  return { ok: true }; // already stamped counts as done: there is nothing left to send
}
