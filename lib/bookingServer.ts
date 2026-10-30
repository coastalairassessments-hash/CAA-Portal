// SERVER ONLY. Finds one booking by its private token, using the service key.
import { createClient } from "@supabase/supabase-js";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();
export const serviceDb = () => {
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};

export const validToken = (t: string) => /^[0-9a-f]{32}$/.test(t);

export async function bookingByToken(token: string) {
  const db = serviceDb();
  if (!db || !validToken(token)) return null;
  const { data } = await db
    .from("requests")
    .select(
      "id, status, issue, name, email, phone, address, city, zip, preferred_date, preferred_time, confirmed_date, confirmed_time, block_hours, deposit_cents, deposit_paid_at, en_route_at, arrived_at, left_at, final_paid_at, source",
    )
    .eq("public_token", token)
    .eq("source", "client")
    .maybeSingle();
  return data ?? null;
}
