import { durationLabel, finalInvoice, minutesOnSite } from "@/lib/billing";
import { formatMoney } from "@/lib/pricing";
import { formatStamp } from "@/lib/labels";
import { markFinalPaid, saveSection, sendFinalInvoice, stampTime } from "../actions";

type Job = Record<string, unknown> & { id: string; issue: string; status: string };

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

export default function Drawers({ r, saved }: { r: Job; saved?: string }) {
  const booked = r.status === "confirmed";
  const minutes = minutesOnSite(str(r.arrived_at) || null, str(r.left_at) || null);
  const depositPaid = booked && typeof r.deposit_cents === "number" ? r.deposit_cents : null;
  const inv = finalInvoice({
    issue: r.issue,
    minutes,
    samples: typeof r.lab_samples === "number" ? r.lab_samples : null,
    extrasCents: typeof r.extras_cents === "number" ? r.extras_cents : 0,
    depositPaidCents: depositPaid,
  });
  const note = (s: string) => (saved === s ? <p className="adm-ok">Saved.</p> : null);

  return (
    <>
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
          {minutes !== null && (
            <p className="adm-line">
              {durationLabel(minutes)} on site
              {inv.quarters > 0 ? `: first hour plus ${inv.quarters} quarter-hour${inv.quarters === 1 ? "" : "s"}` : ": within the first hour"}
            </p>
          )}
        </details>
      )}

      {booked && (
        <details className="adm-group">
          <summary>Lab</summary>
          {note("lab")}
          <form action={saveSection} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Lab" name="lab_name" value={str(r.lab_name)} />
            <div className="adm-row">
              <Field label="Samples" name="lab_samples" value={r.lab_samples == null ? "" : String(r.lab_samples)} inputMode="numeric" />
              <Field label="Chain of custody no." name="lab_coc" value={str(r.lab_coc)} />
            </div>
            <div className="adm-row">
              <Field label="Sent" name="lab_sent_on" value={str(r.lab_sent_on)} type="date" />
              <Field label="Results back" name="lab_results_on" value={str(r.lab_results_on)} type="date" />
            </div>
            <Field label="Lab cost to you ($)" name="lab_cost_cents" value={dollars(r.lab_cost_cents)} inputMode="decimal" />
            <SaveBar id={r.id} section="lab" />
          </form>
        </details>
      )}

      {booked && (
        <details className="adm-group" id="money">
          <summary>Money{depositPaid !== null && <span className="v">{formatMoney(depositPaid)} deposit paid</span>}</summary>
          {note("money")}
          <div className="adm-table">
            <span>First hour</span><span className="amt">{formatMoney(inv.firstHour)}</span>
            {inv.quarters > 0 && (<><span>Extra time ({inv.quarters} × $48.75)</span><span className="amt">{formatMoney(inv.extraTime)}</span></>)}
            {inv.samples > 0 && (<><span>Lab samples</span><span className="amt">{formatMoney(inv.samples)}</span></>)}
            {inv.extras > 0 && (<><span>Other</span><span className="amt">{formatMoney(inv.extras)}</span></>)}
            <span>Total</span><span className="amt">{formatMoney(inv.total)}</span>
            <span>Deposit paid</span><span className="amt">−{formatMoney(inv.deposit)}</span>
            <span className="tot">Balance due</span><span className="tot amt">{formatMoney(inv.balance)}</span>
          </div>
          {minutes === null && <p className="adm-muted">Tap Arrived and Left to add extra time.</p>}
          <form action={saveSection} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="adm-row">
              <Field label="Deposit invoice no." name="deposit_invoice_no" value={str(r.deposit_invoice_no)} />
              <Field label="Final invoice no." name="final_invoice_no" value={str(r.final_invoice_no)} />
            </div>
            <Field label="Other charges ($)" name="extras_cents" value={dollars(r.extras_cents) === "0.00" ? "" : dollars(r.extras_cents)} inputMode="decimal" />
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
          {r.qb_invoice_id ? (
            <p className="adm-note">Final invoice {str(r.final_invoice_no) ? `#${str(r.final_invoice_no)} ` : ""}sent from QuickBooks.</p>
          ) : (
            <form action={sendFinalInvoice}>
              <input type="hidden" name="id" value={r.id} />
              <button className="adm-btn primary wide" type="submit" style={{ marginBottom: 0 }}>
                Send final invoice ({formatMoney(inv.balance)})
              </button>
            </form>
          )}
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
