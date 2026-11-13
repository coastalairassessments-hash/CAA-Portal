// Called every hour by a Netlify scheduled function. Sends the morning (7 AM) and evening (7 PM) briefing.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, connection } from "next/server";
import { addDays, todayInNewYork, TIME_ZONE } from "@/lib/dates";
import { buildBriefing, type BriefJob } from "@/lib/briefing";
import { needsYou, type DashRow } from "@/lib/dashboard";
import { SITE_URL_FALLBACK, sendEmail } from "@/lib/notify";
import { sendLogged } from "@/lib/mailLog";
import { sendPush } from "@/lib/push";
import { briefingPush } from "@/lib/pushText";
import { dayBeforeEmail } from "@/lib/prep";
import { invoiceReminderEmail, reminderDue, type OwedRow } from "@/lib/invoiceReminder";
import { getInvoice } from "@/lib/qbSync";
import { isStripeId } from "@/lib/stripePay";
import { paymentState } from "@/lib/payState";
import { balanceLink } from "@/lib/finalPay";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();
const COLUMNS =
  "id, status, source, booking_mode, issue, name, email, public_token, zip, phone, address, city, confirmed_date, confirmed_time, block_hours, deposit_cents, deposit_paid_at, reminded_for, arrived_at, left_at, lab_samples, extras_cents, trip_only, final_paid_at, final_invoice_no, cancel_refund, refunded_at, qb_invoice_id, final_invoiced_at, invoice_reminders, invoice_reminded_at";

type RemindRow = {
  id: string; source: string; status: string; confirmed_date: string | null; confirmed_time: string | null;
  email: string | null; name: string; phone: string; address: string; city: string; zip: string;
  public_token: string | null; reminded_for: string | null;
};

// The evening before: tell each homeowner how to prepare. reminded_for makes a retry harmless,
// and a job moved to another day gets a fresh reminder.
async function remindTomorrow(db: SupabaseClient, data: unknown[]) {
  const tomorrow = addDays(todayInNewYork(), 1);
  const site = clean(process.env.SITE_URL) || SITE_URL_FALLBACK;
  let count = 0;
  for (const j of data as RemindRow[]) {
    if (j.source !== "client" || j.status !== "confirmed" || j.confirmed_date !== tomorrow || !j.email || !j.confirmed_time) continue;
    if (j.reminded_for === tomorrow) continue;
    const res = await sendLogged(db, j.id, { to: j.email, ...dayBeforeEmail(j, { date: tomorrow, time: j.confirmed_time.slice(0, 5) }, site) });
    if (!res.ok) continue;
    await db.from("requests").update({ reminded_for: tomorrow }).eq("id", j.id);
    count++;
  }
  return { sent: count > 0, count };
}

// Unpaid invoices: a gentle note at 3, 7 and 14 days. Checks QuickBooks first so a paid
// invoice never gets a reminder. Runs with the 5 PM pass.
async function remindUnpaid(db: SupabaseClient, data: unknown[]) {
  const today = todayInNewYork();
  let count = 0;
  for (const j of data as (OwedRow & { id: string; name: string; final_invoice_no: string | null; public_token?: string | null })[]) {
    const n = reminderDue(j, today);
    if (!n || !j.email || !j.qb_invoice_id) continue;
    let link: string | null = null;
    try {
      if (isStripeId(j.qb_invoice_id)) {
        // A card link: the booking page link always works, even after Stripe's page timed out.
        const st = await paymentState(j.qb_invoice_id);
        if (!st || st.paid) continue;
        link = j.public_token ? balanceLink(j.public_token, "") : null;
      } else {
        const inv = await getInvoice(j.qb_invoice_id);
        if (inv && inv.balance === 0) continue;
        link = inv?.link ?? null;
      }
    } catch {
      continue; // cannot confirm it is unpaid, so say nothing
    }
    const res = await sendLogged(db, j.id, { to: j.email, ...invoiceReminderEmail(j, n, link) });
    if (!res.ok) continue;
    await db.from("requests").update({ invoice_reminders: n, invoice_reminded_at: new Date().toISOString() }).eq("id", j.id);
    count++;
  }
  return { count };
}

export async function GET(req: Request) {
  await connection();
  const secret = clean(process.env.IP_HASH_SALT);
  if (!secret || req.headers.get("x-cron-key") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const url = new URL(req.url);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" }).format(new Date()),
  );
  const mode = url.searchParams.get("mode") ?? (hour === 7 ? "today" : hour === 19 ? "tomorrow" : hour === 17 ? "remind" : "");
  if (mode !== "today" && mode !== "tomorrow" && mode !== "remind") return NextResponse.json({ ok: true, sent: false });

  const sbUrl = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const to = clean(process.env.ALERT_EMAIL);
  if (!sbUrl || !key || !to) return NextResponse.json({ ok: false, error: "not set up" }, { status: 500 });
  const db = createClient(sbUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data, error } = await db
    .from("requests")
    .select(COLUMNS)
    .in("status", ["new", "offered", "confirmed", "cancelled"])
    .limit(500);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });

  const rows = (data ?? []) as unknown as (DashRow & BriefJob & { address: string; city: string })[];
  if (mode === "remind") {
    const day = await remindTomorrow(db, data ?? []);
    const owed = await remindUnpaid(db, data ?? []);
    return NextResponse.json({ ok: true, ...day, unpaidReminders: owed.count });
  }
  const date = mode === "today" ? todayInNewYork() : addDays(todayInNewYork(), 1);
  const jobs = rows.filter((r) => r.status === "confirmed" && r.confirmed_date === date && r.confirmed_time);
  const brief = buildBriefing(
    mode as "today" | "tomorrow",
    date,
    jobs.map((j) => ({ ...j, confirmed_time: String(j.confirmed_time).slice(0, 5) })),
    needsYou(rows),
    clean(process.env.SITE_URL) || SITE_URL_FALLBACK,
  );
  // Evening note only when tomorrow has something; the morning one also covers what is waiting.
  if (brief.empty || (mode === "tomorrow" && jobs.length === 0)) return NextResponse.json({ ok: true, sent: false });
  // Phone alert first; email only if no phone is set up.
  if ((await sendPush(briefingPush(brief.subject, brief.text))) > 0) return NextResponse.json({ ok: true, sent: true });
  const sent = await sendEmail({ to, subject: brief.subject, text: brief.text });
  return NextResponse.json({ ok: sent.ok, sent: sent.ok });
}
