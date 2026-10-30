// SERVER ONLY. Uses the Supabase service key, which must never reach a browser.
// Import this file only from route handlers / server code.
import { createClient } from "@supabase/supabase-js";
import { sendEmail, sendEmailAlert } from "./notify";
import { receivedEmail } from "./ack";
import { sendPush, pushConfigured } from "./push";
import { newRequestPush } from "./pushText";
import type { SubmitDeps } from "./submit";

export function productionDeps(
  env: Record<string, string | undefined> = process.env,
): SubmitDeps {
  // Pasted values often carry stray spaces, line breaks or quote marks. Clean them.
  const clean = (v: string | undefined) =>
    v?.trim().replace(/^["']+|["']+$/g, "").trim();
  const url = clean(env.SUPABASE_URL);
  const serviceKey = clean(env.SUPABASE_SERVICE_ROLE_KEY);
  const ipSalt = clean(env.IP_HASH_SALT);
  if (!url || !serviceKey || !ipSalt) {
    const missing = [
      !url && "SUPABASE_URL",
      !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
      !ipSalt && "IP_HASH_SALT",
    ].filter(Boolean);
    throw new Error(`Missing ${missing.join(", ")}`);
  }
  if (!/^https?:\/\/[^\s/]+/.test(url)) {
    // The project URL is not a secret, so showing its start helps us fix it fast.
    throw new Error(`SUPABASE_URL bad, len ${url.length}, starts ${url.slice(0, 12)}`);
  }

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    ipSalt,
    async countRecentByIp(ipHash, sinceIso) {
      const { count, error } = await db
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", sinceIso);
      if (error) throw error;
      return count ?? 0;
    },
    async insert(row) {
      const { data, error } = await db
        .from("requests")
        .insert(row)
        .select("id, public_token")
        .single();
      if (error) throw error;
      return { id: data.id as string, public_token: data.public_token as string | null };
    },
    async notify(row) {
      // Tell Cory, and tell the client their request landed. Neither may fail the request.
      // A phone alert replaces the email to Cory once his phone is set up.
      const phones = pushConfigured() ? await sendPush(newRequestPush(row)) : 0;
      await Promise.allSettled([
        phones ? Promise.resolve() : sendEmailAlert(row, env),
        sendEmail({ to: row.email, ...receivedEmail(row, clean(env.SITE_URL) || undefined) }, env),
      ]);
    },
  };
}
