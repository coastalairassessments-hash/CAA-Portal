// SERVER ONLY. Uses the Supabase service key, which must never reach a browser.
// Import this file only from route handlers / server code.
import { createClient } from "@supabase/supabase-js";
import { sendEmailAlert } from "./notify";
import type { SubmitDeps } from "./submit";

export function productionDeps(
  env: Record<string, string | undefined> = process.env,
): SubmitDeps {
  const url = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const ipSalt = env.IP_HASH_SALT;
  if (!url || !serviceKey || !ipSalt) {
    throw new Error(
      "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or IP_HASH_SALT",
    );
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
        .select("id")
        .single();
      if (error) throw error;
      return { id: data.id as string };
    },
    notify: (row) => sendEmailAlert(row, env),
  };
}
