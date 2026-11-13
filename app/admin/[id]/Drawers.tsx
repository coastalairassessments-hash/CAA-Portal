import type { ReactNode } from "react";
import { durationLabel, finalInvoice, minutesOnSite } from "@/lib/billing";
import { formatMoney } from "@/lib/pricing";
import { formatStamp } from "@/lib/labels";
import { isStripeId, stripeConfigured } from "@/lib/stripePay";
import { markFinalPaid, saveSection, saveVisitTimes, sendFinalInvoice, stampTime } from "../actions";

type Job = Record<string, unknown> & { id: string; issue: string; status: string };

const nyTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
const str = (v: unknown) => (typeof v === "string" ? v : "");
const dollars = (c: unknown) => (typeof c === "number" ? (c / 100).toFixed(2) : "");

function SaveBar({ id, section }: { id: string; section: string }) {
  return (
    <>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="section" value={section} />
      <button className="adm-btn primary wide" type="submit">Save</button>
    </>
  );
}

function Field({ label, name, value, type = "text", inputMode }: {
  label: string; name: string; value: string; type?: string; inputMode?: "decimal" | "numeric";
}) {
  return (
    <div className="adm-field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={value} inputMode={inputMode} />
    </div>
  );
}

export default function Drawers({ r, saved, chargesSlot }: { r: Job; saved?: string; chargesSlot?: ReactNode }) {
  const booked = r.status === "confirmed";
  const minutes = minutesOnSite(str(r.arrived_at) || null, str(r.left_at) || null);
  const depositPaid = booked && typeof r.deposit_cents === "number" ? r.deposit_cents : null;
  const inv = finalInvoice({
    issue: r.issue,
    minutes,
    samples: typeof r.lab_samples === "number" ? r.lab_samples : null,
    extrasCents: typeof r.extras_cents === "number" ? r.extras_cents : 0,
    depositPaidCents: depositPaid,
    tripOnly: r.trip_only === true,
  });
  const note = (s: string) => (saved === s ? <p className="adm-ok">Saved.</p> : null);

  return (
    <>
      {booked && !r.left_at && (
        <section className="adm-group" id="close">
          <h2>I was there</h2>
          <p className="adm-muted">Close the job in one tap. Change the hours if the visit ran different from the plan.</p>
          <form action={saveVisitTimes} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="date" value={str(r.confirmed_date)} />
            <Field label="Hours on site" name="hours" value={String(typeof r.block_hours === "number" ? r.block_hours : 1)} inputMode="decimal" />
            <input type="hidden" name="trip_present" value="1" />
            <label className="adm-line" style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}>
              <input type="checkbox" name="trip_only" defaultChecked={r.trip_only === true} />
              Not ready or no access: bill the trip fee instead of the full price
            </label>
            <button className="adm-btn primary wide" type="submit">I was there. Close the job</button>
          </form>
          <p className="adm-muted">It then waits under Owed until it is paid. You can fix the times or send the invoice from Money.</p>
        </section>
      )}

      {booked && (
        <details className="adm-group" open={!!(r.arrived_at || r.left_at) || undefined}>
          <summary>Time on site</summary>
          <div className="adm-actions">
            {["arrived_at", "left_at"].map((k) => (
              <form key={k} action={stampTime}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="which" value={k} />
                {r[k] ? (
                  <>
                    <input type="hidden" name="clear" value="1" />
                    <button className="adm-btn wide" type="submit">
                      {k === "arrived_at" ? "Arrived" : "Left"} {formatStamp(str(r[k]))} (undo)
                    </button>
                  </>
                ) : (
                  <button className="adm-btn primary wide" type="submit">
                    {k === "arrived_at" ? "Arrived" : "Left"}
                  </button>
                )}
              </form>
            ))}
          </div>
          {note("time")}
          <details className="adm-sub">
            <summary>Enter or fix the times by hand</summary>
            <form action={saveVisitTimes} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="hidden" name="id" value={r.id} />
              <Field label="Visit date" name="date" type="date" value={str(r.confirmed_date)} />
              <div className="adm-row">
                <Field label="Arrived" name="arrive" type="time" value={r.arrived_at ? nyTime(str(r.arrived_at)) : ""} />
                <Field label="Left" name="leave" type="time" value={r.left_at ? nyTime(str(r.left_at)) : ""} />
              </div>
              <Field label="Or total hours (such as 2.5)" name="hours" value="" inputMode="decimal" />
              <input type="hidden" name="trip_present" value="1" />
              <label className="adm-line" style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}>
                <input type="checkbox" name="trip_only" defaultChecked={r.trip_only === true} />
                Not ready or no access: bill the trip fee instead of the full price
              </label>
              <button className="adm-btn wide" type="submit">Save times</button>
              {!r.qb_invoice_id && (
                <button className="adm-btn primary wide" type="submit" name="then" value="invoice">
                  Save times and invoice the balance
                </button>
              )}
            </form>
          </details>
          {minutes !== null && (
            <p className="adm-line">
              {durationLabel(minutes)} on site
              {inv.quarters > 0 ? `: first hour plus ${inv.quarters} quarter-hour${inv.quarters === 1 ? "" : "s"}` : ": within the first hour"}
            </p>
          )}
        </details>
      )}

      {booked && chargesSlot}

      {booked && (
        <details className="adm-group" id="money">
          <summary>Money{depositPaid !== null && <span className="v">{formatMoney(depositPaid)} deposit paid</span>}</summary>
          {note("money")}
          <div className="adm-table">
            {!inv.tripOnly && (<><span>First hour</span><span className="amt">{formatMoney(inv.firstHour)}</span></>)}
            {inv.quarters > 0 && (<><span>Extra time ({inv.quarters} × $48.75)</span><span className="amt">{formatMoney(inv.extraTime)}</span></>)}
            {inv.samples > 0 && (<><span>Lab samples</span><span className="amt">{formatMoney(inv.samples)}</span></>)}
            {inv.extras > 0 && (<><span>Materials and charges</span><span className="amt">{formatMoney(inv.extras)}</span></>)}
            <span>Total</span><span className="amt">{formatMoney(inv.total)}</span>
            <span>Deposit paid</span><span className="amt">−{formatMoney(inv.deposit)}</span>
            <span className="tot">{inv.balance < 0 ? "Refund due" : "Balance due"}</span><span className="tot amt">{formatMoney(Math.abs(inv.balance))}</span>
          </div>
          {minutes === null && <p className="adm-muted">Tap Arrived and Left to add extra time.</p>}
          <form action={saveSection} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="adm-row">
              <Field label="Deposit invoice no." name="deposit_invoice_no" value={str(r.deposit_invoice_no)} />
              <Field label="Final invoice no." name="final_invoice_no" value={str(r.final_invoice_no)} />
            </div>
            {r.source === "contractor" && <Field label="PO or reference number" name="reference" value={str(r.reference)} />}
            <div className="adm-field">
              <label htmlFor="payment_method">Paid by</label>
              <select id="payment_method" name="payment_method" defaultValue={str(r.payment_method)}>
                <option value="">Not paid yet</option>
                <option value="card">Card</option>
                <option value="ach">Bank transfer</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <SaveBar id={r.id} section="money" />
          </form>
          {(() => {
            const card = stripeConfigured();
            const paid = !!r.final_paid_at;
            const viaCard = isStripeId(str(r.qb_invoice_id));
            const sent = !!r.qb_invoice_id;
            if (paid) return <p className="adm-note">Paid. The report is released.</p>;
            if (sent && !card) {
              return <p className="adm-note">Final invoice {str(r.final_invoice_no) ? `#${str(r.final_invoice_no)} ` : ""}sent from QuickBooks.</p>;
            }
            return (
              <>
                {sent && (
                  <p className="adm-note">
                    {viaCard ? "Card link sent. It confirms by itself when paid." : `QuickBooks invoice ${str(r.final_invoice_no) ? `#${str(r.final_invoice_no)} ` : ""}is open.`}
                  </p>
                )}
                <form action={sendFinalInvoice}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="adm-btn primary wide" type="submit" style={{ marginBottom: 0 }}>
                    {!sent
                      ? card ? `Send balance by card link (${formatMoney(inv.balance)})` : `Send final invoice (${formatMoney(inv.balance)})`
                      : viaCard ? `Update and resend (${formatMoney(inv.balance)})` : `Switch to card link (${formatMoney(inv.balance)})`}
                  </button>
                </form>
              </>
            );
          })()}
          <form action={markFinalPaid}>
            <input type="hidden" name="id" value={r.id} />
            {r.final_paid_at ? (
              <>
                <input type="hidden" name="clear" value="1" />
                <button className="adm-btn wide" type="submit">Final paid {formatStamp(str(r.final_paid_at))} (undo)</button>
              </>
            ) : (
              <button className="adm-btn primary wide" type="submit">Mark final payment received</button>
            )}
          </form>
        </details>
      )}

      {r.status !== "declined" && r.status !== "cancelled" && (
        <details className="adm-group">
          <summary>Client</summary>
          {note("client")}
          <form action={saveSection} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="QuickBooks customer ID" name="qb_customer_id" value={str(r.qb_customer_id)} />
            <label className="adm-line" style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}>
              <input type="checkbox" name="repeat_client" defaultChecked={r.repeat_client === true} />
              Repeat client
            </label>
            <p className="adm-muted">Heard about us: {howLabel(str(r.how_heard))}</p>
            <SaveBar id={r.id} section="client" />
          </form>
        </details>
      )}
    </>
  );
}

function howLabel(v: string) {
  return (
    { google: "Google search", referral: "Friend, family or past client", contractor: "Contractor or agent", social: "Facebook or Instagram", other: "Other" } as Record<string, string>
  )[v] ?? "not answered";
}
