// QuickBooks calls this when a payment or invoice changes. We check the signature, then look at our own
// open final invoices. The note itself is never trusted for amounts or ids.
import { NextResponse, connection } from "next/server";
import { serviceDb } from "@/lib/bookingServer";
import { settleAllFinals } from "@/lib/settleFinal";
import { touchesMoney, validSignature } from "@/lib/qbWebhook";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();
const MAX_BODY = 100_000;

export async function POST(req: Request) {
  await connection();
  const raw = await req.text();
  if (raw.length > MAX_BODY) return new NextResponse(null, { status: 413 });
  if (!validSignature(raw, req.headers.get("intuit-signature"), clean(process.env.QB_WEBHOOK_VERIFIER))) {
    return new NextResponse(null, { status: 401 });
  }
  if (!touchesMoney(raw)) return NextResponse.json({ ok: true });
  const db = serviceDb();
  if (!db) return NextResponse.json({ ok: false }, { status: 500 });
  const tally = await settleAllFinals(db).catch(() => ({}));
  return NextResponse.json({ ok: true, ...tally });
}
