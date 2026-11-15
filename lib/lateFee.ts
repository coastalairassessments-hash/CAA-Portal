// SERVER ONLY. The daily watch on unpaid contractor invoices: a reminder on day 25, then the $250
// administrative fee after day 30. Only contractors who accepted the billing terms, never a trip-fee
// invoice, and each step happens once per invoice (the marks on the job make it safe to run every few minutes).
import type { SupabaseClient } from "@supabase/supabase-js";
import { finalInvoice, minutesOnSite } from "./billing";
import { LATE_FEE_AFTER_DAYS, LATE_FEE_CENTS, LATE_FEE_LABEL, feeStage, CONTRACTOR_INVOICE_LINE } from "./contractorTerms";
import { listCharges, syncExtras } from "./chargeServer";
import { addDays, formatDateLabel, todayInNewYork } from "./dates";
import { createCheckout, expireCheckout, getCheckout, isStripeId } from "./stripePay";
import { siteBase } from "./finalPay";
import { invoiceNumber } from "./invoiceNo";
import { jobLabel } from "./labels";
import { formatMoney } from "./pricing";
import { sendEmail } from "./notify";

type Job = Record<string, any> & { id: string; issue: string }; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function sweepContractorFees(db: SupabaseClient, now: Date = new Date()): Promise<{ reminded: number; fees: number }> {
  const out = { reminded: 0, fees: 0 };
  const { data } = await db
    .from("requests")
    .select("*, contractors(name, email, terms_accepted_at)")
    .eq("source", "contractor")
    .eq("status", "confirmed")
    .eq("trip_only", false)
    .is("final_paid_at", null)
    .is("late_fee_added_at", null)
    .not("final_invoiced_at", "is", null)
    .limit(200);
  const today = todayInNewYork(now);
  for (const row of (data ?? []) as (Job & { contractors: { name: string; email: string | null; terms_accepted_at: string | null } | null })[]) {
    const c = row.contractors;
    if (!c?.terms_accepted_at || !c.email) continue;
    const invoicedOn = todayInNewYork(new Date(row.final_invoiced_at));
    const stage = feeStage(invoicedOn, today);
    if (stage === "none") continue;
    try {
      if (stage === "fee") {
        if (await addFee(db, row, c.email, c.name)) out.fees++;
      } else if (!row.reminder_sent_at) {
        if (await remind(db, row, c.email, c.name, invoicedOn)) out.reminded++;
      }
    } catch (e) {
      console.error("[late fee]", e instanceof Error ? e.message : e);
    }
  }
  return out;
}

const first = (n: string) => n.trim().split(/\s+/)[0] || "there";
const invoiceLink = (r: Job) => (r.public_token ? `${siteBase()}/invoice/${r.public_token}` : siteBase());

async function remind(db: SupabaseClient, r: Job, to: string, name: string, invoicedOn: string): Promise<boolean> {
  const feeOn = formatDateLabel(addDays(invoicedOn, LATE_FEE_AFTER_DAYS + 1));
  const sent = await sendEmail({
    to,
    subject: `Reminder: invoice ${invoiceNumber(r)} is unpaid - Coastal Air Assessments`,
    text: [
      `Hi ${first(name)},`,
      "",
      `Invoice ${invoiceNumber(r)} for ${jobLabel(r)} at ${r.address} is still open.`,
      `Under our billing terms, a ${formatMoney(LATE_FEE_CENTS)} administrative fee is added to invoices unpaid after ${LATE_FEE_AFTER_DAYS} days. Pay by ${formatDateLabel(addDays(invoicedOn, LATE_FEE_AFTER_DAYS))} to avoid it (it would be added ${feeOn}).`,
      "",
      "View the invoice and pay by card:",
      invoiceLink(r),
      "",
      "Coastal Air Assessments",
    ].join("\n"),
  });
  if (!sent.ok) return false;
  await db.from("requests").update({ reminder_sent_at: now() }).eq("id", r.id);
  return true;
}

async function addFee(db: SupabaseClient, r: Job, to: string, name: string): Promise<boolean> {
  // If they just paid, the 5-minute check has not recorded it yet. Never charge a fee on a paid invoice.
  if (isStripeId(r.qb_invoice_id) && (await getCheckout(r.qb_invoice_id).catch(() => null))?.paid) return false;
  // Claim first, so two overlapping runs can never add it twice.
  const { data: claimed } = await db.from("requests").update({ late_fee_added_at: now() }).eq("id", r.id).is("late_fee_added_at", null).is("final_paid_at", null).select("id");
  if (!claimed?.length) return false;
  await db.from("job_charges").insert({ request_id: r.id, kind: "other", description: LATE_FEE_LABEL, qty: 1, unit_cents: LATE_FEE_CENTS });
  const extras = await syncExtras(db, r.id);
  const inv = finalInvoice({
    issue: r.issue,
    minutes: minutesOnSite(r.arrived_at, r.left_at),
    samples: r.lab_samples,
    extrasCents: extras,
    depositPaidCents: r.deposit_paid_at && typeof r.deposit_cents === "number" ? r.deposit_cents : null,
    tripOnly: false,
  });
  // The old card page still shows the old amount, so replace it.
  if (isStripeId(r.qb_invoice_id)) await expireCheckout(r.qb_invoice_id);
  const number = invoiceNumber(r);
  const link = invoiceLink(r);
  const made = await createCheckout({
    cents: inv.balance,
    description: `Invoice ${number}, ${r.address} - Coastal Air Assessments`,
    requestId: r.id,
    successUrl: r.public_token ? `${siteBase()}/booking/${r.public_token}/balance` : link,
    cancelUrl: link,
  });
  await db.from("requests").update({ qb_invoice_id: made.id }).eq("id", r.id).is("final_paid_at", null);
  await listCharges(db, r.id); // keep the line list warm for the invoice page
  const sent = await sendEmail({
    to,
    subject: `Administrative fee added to invoice ${number} - Coastal Air Assessments`,
    text: [
      `Hi ${first(name)},`,
      "",
      `Invoice ${number} for ${jobLabel(r)} at ${r.address} was unpaid after ${LATE_FEE_AFTER_DAYS} days, so a ${formatMoney(LATE_FEE_CENTS)} administrative fee was added, as in our billing terms.`,
      `New balance: ${formatMoney(inv.balance)}.`,
      "",
      "View the invoice and pay by card:",
      link,
      "",
      CONTRACTOR_INVOICE_LINE,
      "",
      "Coastal Air Assessments",
    ].join("\n"),
  });
  if (!sent.ok) console.error(`[late fee] email not sent: ${sent.reason}`);
  return true;
}

const now = () => new Date().toISOString();
