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
  const { data: blocks } = await db.from("time_blocks").select("day, slot").gte("day", fromDate);
  const closed: Slot[] = (blocks ?? []).map((b) =>
    b.slot === "all"
      ? { date: b.day as string, time: "10:00", hours: 3 }
      : { date: b.day as string, time: b.slot as string, hours: 1 },
  );
  // If the lookup fails the calendar still works; the database rule still prevents a double booking.
  if (error || !data) return [];
  return [...closed, ...data
    .filter((r) => r.confirmed_date && r.confirmed_time)
    .map((r) => ({
      date: r.confirmed_date as string,
      time: String(r.confirmed_time).slice(0, 5),
      hours: Number(r.block_hours ?? 1),
    }))];
}
