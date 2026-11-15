// Stripe calls this the moment a payment clears. See lib/stripeWebhook.ts.
import { NextResponse } from "next/server";
import { serviceDb } from "@/lib/bookingServer";
import { handleStripeEvent, verifyStripeSignature } from "@/lib/stripeWebhook";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export async function POST(req: Request) {
  const secret = clean(process.env.STRIPE_WEBHOOK_SECRET);
  if (!secret) return NextResponse.json({ ok: false, error: "not set up" }, { status: 503 });
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const db = serviceDb();
  if (!db) return NextResponse.json({ ok: false }, { status: 500 });
  let event;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  try {
    const result = await handleStripeEvent(db, event);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    // A 500 makes Stripe retry, and the 5-minute sweep is the backup either way.
    console.error("[stripe webhook]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
