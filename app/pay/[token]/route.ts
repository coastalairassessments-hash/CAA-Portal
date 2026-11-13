// The permanent link in the email. Opens the card page, makes a fresh one if it timed out, never charges twice.
import { NextResponse, connection } from "next/server";
import { serviceDb, validToken } from "@/lib/bookingServer";
import { createCheckout, getCheckout, isStripeId } from "@/lib/stripePay";
import { siteBase } from "@/lib/finalPay";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const db = serviceDb();
  if (!db || !validToken(token)) return NextResponse.redirect(new URL("/", request.url), 303);
  const done = new URL(`/pay/${token}/done`, request.url);

  const { data: r } = await db.from("payment_links").select("*").eq("token", token).maybeSingle();
  if (!r) return NextResponse.redirect(new URL("/", request.url), 303);
  if (r.paid_at) return NextResponse.redirect(done, 303);

  try {
    if (isStripeId(r.stripe_id)) {
      const s = await getCheckout(r.stripe_id);
      if (s.paid) {
        await db.from("payment_links").update({ paid_at: new Date().toISOString() }).eq("id", r.id).is("paid_at", null);
        return NextResponse.redirect(done, 303);
      }
      if (!s.expired && s.url) return NextResponse.redirect(s.url, 303);
    }
    const link = `${siteBase()}/pay/${token}`;
    const made = await createCheckout({
      cents: r.amount_cents,
      description: `${r.description} - Coastal Air Assessments`,
      email: r.email,
      requestId: r.id,
      successUrl: link,
      cancelUrl: link,
    });
    await db.from("payment_links").update({ stripe_id: made.id }).eq("id", r.id).is("paid_at", null);
    return NextResponse.redirect(made.url, 303);
  } catch (e) {
    console.error("[pay] could not open the payment page:", e instanceof Error ? e.message : e);
    return NextResponse.redirect(new URL("/", request.url), 303);
  }
}
