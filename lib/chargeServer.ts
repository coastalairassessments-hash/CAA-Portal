// SERVER ONLY. Reads and keeps the charges on a job. "extras_cents" on the job always equals their total,
// so every screen that already adds up a balance stays right.
import type { SupabaseClient } from "@supabase/supabase-js";
import { TRIP_FEE_CENTS, sumCharges, type Charge } from "./charges";

type Db = Pick<SupabaseClient, "from">;

export async function listCharges(db: Db, id: string): Promise<Charge[]> {
  const { data } = await db.from("job_charges").select("id, kind, description, qty, unit_cents").eq("request_id", id).order("created_at", { ascending: true });
  return ((data ?? []) as Charge[]).map((c) => ({ ...c, qty: Number(c.qty) }));
}

// Older jobs kept one typed "other charges" amount. Keep it as a line before the first new charge.
export async function preserveLegacy(db: Db, id: string): Promise<void> {
  if ((await listCharges(db, id)).length) return;
  const { data } = await db.from("requests").select("extras_cents").eq("id", id).maybeSingle();
  const cents = typeof data?.extras_cents === "number" ? data.extras_cents : 0;
  if (cents > 0) await db.from("job_charges").insert({ request_id: id, kind: "other", description: "Other charges", qty: 1, unit_cents: cents });
}

export async function syncExtras(db: Db, id: string): Promise<number> {
  const total = sumCharges(await listCharges(db, id));
  await db.from("requests").update({ extras_cents: total }).eq("id", id);
  return total;
}

export async function ensureTripFee(db: Db, id: string): Promise<void> {
  await preserveLegacy(db, id);
  const have = (await listCharges(db, id)).some((c) => c.kind === "trip");
  if (!have) await db.from("job_charges").insert({ request_id: id, kind: "trip", description: "Trip fee", qty: 1, unit_cents: TRIP_FEE_CENTS });
  await syncExtras(db, id);
}

export async function removeTripFee(db: Db, id: string): Promise<void> {
  await db.from("job_charges").delete().eq("request_id", id).eq("kind", "trip");
  await syncExtras(db, id);
}
