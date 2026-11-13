// Called every few minutes by a Netlify scheduled function. Books anyone who has paid their deposit
// and releases the time of anyone who walked away.
import { NextResponse, connection } from "next/server";
import { serviceDb } from "@/lib/bookingServer";
import { SETTLE_COLUMNS, settleDeposit } from "@/lib/settle";
import { sendReadyReports } from "@/lib/reportServer";
import { qbHealth } from "@/lib/qbSync";
import { settleFinalPayment } from "@/lib/finalPay";

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
  // Balances paid by card: record them and release the report.
  const { data: owing } = await db
    .from("requests")
    .select("id, name, email, source, public_token, qb_invoice_id, final_paid_at")
    .eq("status", "confirmed")
    .like("qb_invoice_id", "cs_%")
    .is("final_paid_at", null)
    .limit(100);
  let finals = 0;
  for (const row of owing ?? []) {
    if (await settleFinalPayment(db, row as never).catch(() => false)) finals++;
  }
  // A light QuickBooks call every run keeps the connection renewed, so it never lapses from disuse.
  await qbHealth();
  const reports = await sendReadyReports(db).catch(() => 0);
  return NextResponse.json({ ok: true, ...tally, reports, finals });
}
