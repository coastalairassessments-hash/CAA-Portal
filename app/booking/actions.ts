"use server";
import { redirect } from "next/navigation";
import { bookingByToken, serviceDb, validToken } from "@/lib/bookingServer";
import { refundDue } from "@/lib/cancel";
import { cancelEmail } from "@/lib/confirm";
import { sendEmail } from "@/lib/notify";
import { sendPush } from "@/lib/push";
import { SETTLE_COLUMNS, settleDeposit } from "@/lib/settle";
import { voidInvoice } from "@/lib/qbSync";
import { formatDateLabel } from "@/lib/dates";
import { formatTime } from "@/lib/labels";

// A client cancels their own booking. Same rule as the policy: refund if more than 24 hours ahead.
export async function cancelMyBooking(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "");
  if (!validToken(token)) redirect("/");
  let r = await bookingByToken(token);
  const db = serviceDb();
  if (!r || !db) redirect(`/booking/${token}`);
  // They may have just paid. Book that first, so a paid deposit is never lost by a cancel.
  if (r.status === "offered" && r.booking_mode === "instant" && r.qb_deposit_invoice_id) {
    const { data: full } = await db.from("requests").select(SETTLE_COLUMNS).eq("id", r.id).maybeSingle();
    if (full) await settleDeposit(db, full as never).catch(() => "waiting");
    r = (await bookingByToken(token)) ?? r;
  }
  if (!["new", "offered", "confirmed"].includes(r.status) || r.left_at) redirect(`/booking/${token}`);

  const date = (r.confirmed_date ?? r.preferred_date) as string;
  const time = String(r.confirmed_time ?? r.preferred_time).slice(0, 5);
  const paid = r.status === "confirmed";
  const refund = paid ? refundDue(date, time) : false;

  const { error } = await db
    .from("requests")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_refund: paid ? refund : null })
    .eq("id", r.id)
    .in("status", ["new", "offered", "confirmed"]);
  if (error) redirect(`/booking/${token}?error=1`);

  // Never paid: close the deposit invoice so it does not sit open in QuickBooks, and say nothing more.
  if (r.booking_mode === "instant" && r.status === "offered" && r.qb_deposit_invoice_id) {
    await voidInvoice(r.qb_deposit_invoice_id);
    redirect(`/booking/${token}`);
  }

  const slot = { date, time, hours: Number(r.block_hours ?? 1) };
  const sent = await sendEmail({ to: r.email, ...cancelEmail(r as never, slot, refund, paid) });
  if (!sent.ok) console.error(`[client-cancel] email not sent: ${sent.reason}`);

  // Tell Cory. A phone alert first; email if no phone is set up.
  const what = `${r.name} cancelled ${formatDateLabel(date)} at ${formatTime(time)}${paid ? (refund ? " (refund due)" : " (inside 24 hours, deposit kept)") : ""}`;
  const phones = await sendPush({ title: "Booking cancelled", body: what, url: `/admin/${r.id}` });
  const to = process.env.ALERT_EMAIL?.trim();
  if (!phones && to) await sendEmail({ to, subject: "Booking cancelled", text: what });
  redirect(`/booking/${token}`);
}
