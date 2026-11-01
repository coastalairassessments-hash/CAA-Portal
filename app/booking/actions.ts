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
import { canMove, movedEmail } from "@/lib/reschedule";
import { heldSlots } from "@/lib/availabilityServer";
import { overlaps } from "@/lib/slots";
import { todayInNewYork } from "@/lib/dates";

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

// A client moves their own visit to another open time. Free, more than 24 hours ahead. The deposit carries over.
export async function rescheduleMyBooking(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "");
  if (!validToken(token)) redirect("/");
  const r = await bookingByToken(token);
  const db = serviceDb();
  if (!r || !db || !canMove(r as never)) redirect(`/booking/${token}`);
  const [date = "", time = ""] = String(form.get("slot") ?? "").split("|");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !["10:00", "12:30"].includes(time)) redirect(`/booking/${token}?error=1`);

  const hours = Number(r.block_hours ?? 1);
  const cur = { date: r.confirmed_date as string, time: String(r.confirmed_time).slice(0, 5), hours };
  const next = { date, time, hours };
  const others = (await heldSlots(todayInNewYork())).filter((h) => !(h.date === cur.date && h.time === cur.time));
  if (others.some((h) => overlaps(h, next))) redirect(`/booking/${token}?error=taken`);
  if (!canMove({ ...r, confirmed_date: date, confirmed_time: time } as never)) redirect(`/booking/${token}?error=1`);

  const { error } = await db
    .from("requests")
    .update({ confirmed_date: date, confirmed_time: time, reminded_for: null })
    .eq("id", r.id)
    .eq("status", "confirmed");
  if (error) redirect(`/booking/${token}?error=${error.code === "23P01" ? "taken" : "1"}`);

  const sent = await sendEmail({ to: r.email, ...movedEmail(r as never, r.id, next) });
  if (!sent.ok) console.error(`[client-move] email not sent: ${sent.reason}`);
  const what = `${r.name} moved ${formatDateLabel(cur.date)} ${formatTime(cur.time)} to ${formatDateLabel(date)} ${formatTime(time)}`;
  const phones = await sendPush({ title: "Visit moved", body: what, url: `/admin/${r.id}` });
  const to = process.env.ALERT_EMAIL?.trim();
  if (!phones && to) await sendEmail({ to, subject: "Visit moved", text: what });
  redirect(`/booking/${token}?moved=1`);
}
