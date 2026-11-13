// The one pay link a client ever uses. Whatever state their payment page is in (open, expired,
// already paid, tapped twice), this sends them to the right place and never makes a second charge.
import { NextResponse, connection } from "next/server";
import { serviceDb, validToken } from "@/lib/bookingServer";
import { getCheckout, isStripeId } from "@/lib/stripePay";
import { createDeposit } from "@/lib/depositPay";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const back = new URL(`/booking/${token}`, request.url);
  const db = serviceDb();
  if (!db || !validToken(token)) return NextResponse.redirect(new URL("/", request.url), 303);

  const { data: r } = await db
    .from("requests")
    .select("id, status, name, phone, email, address, city, zip, confirmed_date, confirmed_time, deposit_cents, qb_deposit_invoice_id, pay_url, public_token")
    .eq("public_token", token)
    .maybeSingle();
  if (!r || r.status !== "offered" || !r.qb_deposit_invoice_id) return NextResponse.redirect(back, 303);

  // Not a Stripe payment (an older QuickBooks invoice): use its own link.
  if (!isStripeId(r.qb_deposit_invoice_id)) return NextResponse.redirect(r.pay_url || back, 303);

  try {
    const s = await getCheckout(r.qb_deposit_invoice_id);
    if (s.paid) return NextResponse.redirect(back, 303); // the booking page confirms it
    if (!s.expired && s.url) return NextResponse.redirect(s.url, 303);
    // The old page timed out. Make one fresh page and replace it, so there is only ever one open.
    const made = await createDeposit(r as never);
    await db.from("requests").update({ qb_deposit_invoice_id: made.invoiceId, pay_url: made.payUrl }).eq("id", r.id).eq("status", "offered");
    return NextResponse.redirect(made.payUrl || back, 303);
  } catch (e) {
    console.error("[pay] could not open the payment page:", e instanceof Error ? e.message : e);
    return NextResponse.redirect(r.pay_url || back, 303);
  }
}
