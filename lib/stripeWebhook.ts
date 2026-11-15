// SERVER ONLY. Stripe tells us the moment a card clears, so "Paid" shows instantly instead of waiting
// for the 5-minute sweep. Safe by design: the signature proves it came from Stripe, and every handler
// re-asks Stripe whether the session is really paid before recording anything. The sweep stays as backup.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SETTLE_COLUMNS, settleDeposit } from "./settle";
import { settleFinalPayment } from "./finalPay";
import { getCheckout } from "./stripePay";
import { recordPayment } from "./ledger";

const TOLERANCE_SECONDS = 300;

// Stripe-Signature looks like "t=1700000000,v1=abcdef...". The signed text is `${t}.${rawBody}`.
export function verifyStripeSignature(raw: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)): boolean {
  if (!header || !secret) return false;
  let t = "";
  const sigs: string[] = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") sigs.push(v);
  }
  const ts = Number(t);
  if (!t || !Number.isFinite(ts) || !sigs.length) return false;
  if (Math.abs(nowSec - ts) > TOLERANCE_SECONDS) return false;
  const want = createHmac("sha256", secret).update(`${t}.${raw}`).digest();
  return sigs.some((s) => {
    if (!/^[0-9a-f]{64}$/i.test(s)) return false;
    return timingSafeEqual(want, Buffer.from(s, "hex"));
  });
}

export type WebhookResult = "deposit" | "final" | "link" | "ignored" | "waiting";

const PAID_EVENTS = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);

type StripeEvent = { type?: string; data?: { object?: { id?: unknown } } };

export async function handleStripeEvent(db: SupabaseClient, event: StripeEvent): Promise<WebhookResult> {
  if (!event.type || !PAID_EVENTS.has(event.type)) return "ignored";
  const id = event.data?.object?.id;
  if (typeof id !== "string" || !id.startsWith("cs_")) return "ignored";

  // Never trust the event body for money: ask Stripe directly.
  const s = await getCheckout(id).catch(() => null);
  if (!s?.paid) return "waiting";

  // 1. A deposit that books a visit.
  const dep = await db.from("requests").select(SETTLE_COLUMNS).eq("qb_deposit_invoice_id", id).maybeSingle();
  if (dep.data) {
    const r = await settleDeposit(db, dep.data as never);
    return r === "paid" ? "deposit" : "waiting";
  }
  // 2. A final balance.
  const fin = await db
    .from("requests")
    .select("id, name, email, source, public_token, qb_invoice_id, final_paid_at")
    .eq("qb_invoice_id", id)
    .maybeSingle();
  if (fin.data) return (await settleFinalPayment(db, fin.data as never)) ? "final" : "waiting";
  // 3. A one-off payment link.
  const link = await db
    .from("payment_links")
    .update({ paid_at: new Date().toISOString() })
    .eq("stripe_id", id)
    .is("paid_at", null)
    .select("id, name");
  const l = link.data?.[0] as { id: string; name: string } | undefined;
  if (!l) return "ignored";
  await recordPayment(db, { stripeId: id, kind: "link", cents: s.cents, name: l.name, linkId: l.id });
  return "link";
}
