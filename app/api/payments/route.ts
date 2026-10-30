// Called every few minutes by a Netlify scheduled function. Books anyone who has paid their deposit
// and releases the time of anyone who walked away.
import { NextResponse, connection } from "next/server";
import { serviceDb } from "@/lib/bookingServer";
import { SETTLE_COLUMNS, settleDeposit } from "@/lib/settle";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export async function GET(req: Request) {
  await connection();
  const secret = clean(process.env.IP_HASH_SALT);
  if (!secret || req.headers.get("x-cron-key") !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  const db = serviceDb();
  if (!db) return NextResponse.json({ ok: false, error: "not set up" }, { status: 500 });

  const { data, error } = await db
    .from("requests")
    .select(SETTLE_COLUMNS)
    .eq("status", "offered")
    .eq("booking_mode", "instant")
    .not("qb_deposit_invoice_id", "is", null)
    .limit(100);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });

  const tally: Record<string, number> = {};
  for (const row of data ?? []) {
    const r = await settleDeposit(db, row as never).catch((e) => {
      console.error("[payments] settle failed:", e instanceof Error ? e.message : e);
      return "waiting" as const;
    });
    tally[r] = (tally[r] ?? 0) + 1;
  }
  return NextResponse.json({ ok: true, ...tally });
}
