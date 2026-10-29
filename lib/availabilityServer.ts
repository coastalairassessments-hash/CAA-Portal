// SERVER ONLY. Reads which times are held, using the service key. Returns no personal details.
import { createClient } from "@supabase/supabase-js";
import type { Slot } from "./slots";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export async function heldSlots(fromDate: string): Promise<Slot[]> {
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) return [];
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db
    .from("requests")
    .select("confirmed_date, confirmed_time, block_hours")
    .eq("status", "confirmed")
    .gte("confirmed_date", fromDate);
  // If the lookup fails the calendar still works; the database rule still prevents a double booking.
  if (error || !data) return [];
  return data
    .filter((r) => r.confirmed_date && r.confirmed_time)
    .map((r) => ({
      date: r.confirmed_date as string,
      time: String(r.confirmed_time).slice(0, 5),
      hours: Number(r.block_hours ?? 1),
    }));
}
