// The one link a client uses to pay their balance. Opens the card page, makes a fresh one if it timed out,
// and never charges twice.
import { NextResponse, connection } from "next/server";
import { serviceDb, validToken } from "@/lib/bookingServer";
import { createCheckout, getCheckout, isStripeId } from "@/lib/stripePay";
import { settleFinalPayment, siteBase } from "@/lib/finalPay";
import { jobLabel } from "@/lib/labels";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  let back = new URL(`/booking/${token}`, request.url);
  const db = serviceDb();
  if (!db || !validToken(token)) return NextResponse.redirect(new URL("/", request.url), 303);

  const { data: r } = await db.from("requests").select("*").eq("public_token", token).maybeSingle();
  if (r?.source === "contractor") back = new URL(`/invoice/${token}`, request.url);
  if (!r || r.final_paid_at || !isStripeId(r.qb_invoice_id)) return NextResponse.redirect(back, 303);

  try {
    const s = await getCheckout(r.qb_invoice_id);
    if (s.paid) {
      await settleFinalPayment(db, r);
      return NextResponse.redirect(back, 303);
    }
    if (!s.expired && s.url) return NextResponse.redirect(s.url, 303);
    // Timed out: one fresh page for the same amount replaces it.
    const made = await createCheckout({
      cents: s.cents,
      description: `Balance for ${jobLabel(r)} - Coastal Air Assessments`,
      email: r.email ?? undefined,
      requestId: r.id,
      successUrl: `${siteBase()}/booking/${token}/balance`,
      cancelUrl: back.toString(),
    });
    await db.from("requests").update({ qb_invoice_id: made.id }).eq("id", r.id).is("final_paid_at", null);
    return NextResponse.redirect(made.url, 303);
  } catch (e) {
    console.error("[balance] could not open the payment page:", e instanceof Error ? e.message : e);
    return NextResponse.redirect(back, 303);
  }
}
