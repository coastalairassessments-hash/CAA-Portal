import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Logo from "@/app/components/Logo";
import { serviceDb, validToken } from "@/lib/bookingServer";
import { listCharges } from "@/lib/chargeServer";
import { balanceRows } from "@/lib/balanceText";
import { finalInvoice, minutesOnSite, durationLabel } from "@/lib/billing";
import { formatMoney } from "@/lib/pricing";
import { formatDateLabel } from "@/lib/dates";
import { jobLabel } from "@/lib/labels";
import { dueDate, invoiceNumber } from "@/lib/invoiceNo";
import { isStripeId } from "@/lib/stripePay";
import { PHONE } from "@/lib/business";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "Invoice | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

async function Invoice({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const db = serviceDb();
  if (!db || !validToken(token)) notFound();
  const { data: r } = await db.from("requests").select("*").eq("public_token", token).maybeSingle();
  if (!r || r.status !== "confirmed") notFound();

  if (!r.left_at) {
    return (
      <>
        <h1>Invoice</h1>
        <p className="bk-lead">This visit has not happened yet, so there is no invoice. Questions? Call or text {PHONE}.</p>
      </>
    );
  }

  const charges = await listCharges(db, r.id);
  const minutes = minutesOnSite(r.arrived_at, r.left_at);
  const inv = finalInvoice({
    issue: r.issue,
    minutes,
    samples: r.lab_samples,
    extrasCents: r.extras_cents ?? 0,
    depositPaidCents: r.deposit_paid_at && typeof r.deposit_cents === "number" ? r.deposit_cents : null,
    tripOnly: r.trip_only === true,
  });
  const rows = balanceRows({ inv, tripOnly: r.trip_only === true, service: jobLabel(r), charges, legacySamples: typeof r.lab_samples === "number" ? r.lab_samples : 0 });
  const paid = !!r.final_paid_at;
  const canPay = !paid && isStripeId(r.qb_invoice_id) && inv.balance > 0;

  return (
    <>
      <h1>Invoice {invoiceNumber(r)}</h1>
      <p className="bk-lead">
        {paid ? "Paid. Thank you." : `Due ${formatDateLabel(dueDate(r))}.`}
      </p>
      <dl className="bk-facts">
        <div><dt>Bill to</dt><dd>{r.source === "contractor" ? r.name : `${r.name}`}</dd></div>
        <div><dt>Job</dt><dd>{jobLabel(r)}<br />{r.address}{r.city ? `, ${r.city}` : ""}</dd></div>
        <div><dt>Date</dt><dd>{r.confirmed_date ? formatDateLabel(r.confirmed_date) : ""}{minutes !== null && !r.trip_only ? ` · ${durationLabel(minutes)} on site` : ""}</dd></div>
        {r.reference && <div><dt>Ref / PO</dt><dd>{r.reference}</dd></div>}
      </dl>
      <section className="bk-prep">
        <h2>What this covers</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} style={row.strong ? { fontWeight: 700, borderTop: "1px solid #dae2e8" } : undefined}>
                <td style={{ padding: "6px 0" }}>{row.label}</td>
                <td style={{ padding: "6px 0", textAlign: "right", whiteSpace: "nowrap" }}>{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {canPay && (
        <section className="bk-pay">
          <a className="btn" href={`/booking/${token}/balance`}>Pay {formatMoney(inv.balance)} by card</a>
          <p className="bk-pay-note">Secure card payment. The report is released as soon as it is paid.</p>
        </section>
      )}
      <PrintButton />
      <p className="bk-foot">Questions about this invoice? Call or text {PHONE}.</p>
    </>
  );
}

export default function InvoicePage(props: { params: Promise<{ token: string }> }) {
  return (
    <>
      <header className="wrap site-header"><Logo /></header>
      <main className="wrap bk">
        <Suspense fallback={<p className="step-count">Loading...</p>}>
          <Invoice {...props} />
        </Suspense>
      </main>
    </>
  );
}
