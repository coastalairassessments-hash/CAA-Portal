import Link from "next/link";
import { formatPhone, formatStamp, formatTime, fullAddress, jobLabel, sizeLabel } from "@/lib/labels";
import { formatDateLabel } from "@/lib/dates";
import { mapsLink } from "@/lib/admin";
import { confirmText, offerText, smsLink } from "@/lib/confirm";
import { GOOGLE_REVIEW_URL, depositReminderText, reviewText } from "@/lib/quicktexts";
import { depositCents, firstHourCents, formatMoney } from "@/lib/pricing";
import { googleCalendarLink } from "@/lib/calendar";
import { cancelBooking, cancelJob, declineRequest, markDepositReceived, markRefunded, stampTime } from "../actions";
import { hoursUntil, refundDue } from "@/lib/cancel";
import { STAGES, stageDone } from "@/lib/stage";
import ConfirmForm from "./ConfirmForm";
import Drawers from "./Drawers";

type Query = Record<string, string | string[] | undefined>;
// The job as it comes from the database.
type Job = {
  id: string; issue: string; status: string; name: string; address: string;
  city: string | null; zip: string | null; phone: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

const statusLabel = (s: string) =>
  s === "new" ? "New" : s === "offered" ? "Deposit waiting" : s === "confirmed" ? "Booked" : s === "cancelled" ? "Cancelled" : s === "declined" ? "Declined" : s;

export default function JobView({ r, query }: { r: Job; query: Query }) {
  const contractor = r.source === "contractor";
  const slot = r.confirmed_date
    ? { date: r.confirmed_date as string, time: r.confirmed_time as string, hours: r.block_hours as number }
    : null;
  const booking = r.status === "confirmed" ? slot : null;
  const offer = r.status === "offered" ? slot : null;
  const deposit = (r.deposit_cents as number | null) ?? depositCents(r.issue);
  const open = r.status !== "declined" && r.status !== "cancelled";
  const emailNote = query.email;
  const cr = { ...r, phone: r.phone ?? "", city: r.city ?? "", zip: r.zip ?? "" }; // client rows always have a phone; contractor rows never reach the text buttons

  const approve = !contractor && open && (
    <section className="adm-panel tint" id="approve">
      <h2>{booking ? "Change the booking" : offer ? "Change the offer" : "Approve"}</h2>
      <ConfirmForm
        id={r.id}
        defaultDate={slot?.date ?? r.preferred_date}
        defaultTime={slot?.time ?? r.preferred_time}
        label={booking ? "Update and email client" : offer ? "Resend offer" : "Approve and send deposit offer"}
      />
      {!booking && (
        <form action={declineRequest}>
          <input type="hidden" name="id" value={r.id} />
          <button className="adm-quiet" type="submit">Decline and email client</button>
        </form>
      )}
    </section>
  );

  return (
    <>
      <Link className="adm-back" href="/admin/today">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        Back to Today
      </Link>
      <div className="adm-chips" style={{ margin: "4px 0 8px" }}>
        <span className={`adm-chip${contractor ? "" : " solid"}`}>{contractor ? "Contractor" : "Homeowner"}</span>
        <span className={`adm-pill${r.status === "confirmed" ? " solid" : ""}`}>{statusLabel(r.status)}</span>
        {r.area === "outside" && <span className="adm-chip warn">Outside area</span>}
      </div>

      {emailNote === "sent" && <p className="adm-note">Email sent to the client.</p>}
      {emailNote === "failed" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>
          The email to the client could not be sent. Use the text button, or contact them yourself.
        </p>
      )}
      {query.error === "taken" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>
          Another paid job already holds that time, so this deposit could not be booked. Change this client&apos;s time below, then mark it again.
        </p>
      )}
      {query.error === "check" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>Check the numbers and dates, then save again.</p>
      )}
      {query.error === "qbconnect" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>QuickBooks is not connected. Connect it on the More screen.</p>
      )}
      {query.error === "qb" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>QuickBooks did not accept the invoice. Nothing was sent. Try again.</p>
      )}
      {query.saved === "invoice-unsent" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>The invoice is in QuickBooks, but it could not be emailed. Send it from QuickBooks.</p>
      )}
      {query.error && !["taken", "check", "qb", "qbconnect"].includes(String(query.error)) && (
        <p className="adm-err" style={{ marginBottom: 14 }}>Something did not save. Try again.</p>
      )}

      <h1 className="adm-title sm" style={{ marginTop: 0 }}>{r.name}</h1>
      <div className="adm-info">
        <div>{jobLabel(r)}{r.size_band ? ` · ${sizeLabel(r.size_band)}` : ""}</div>
        <div>{fullAddress(r)}</div>
        {!contractor && (
          <>
            {!slot && <div className="m">Asked for {formatDateLabel(r.preferred_date)} at {formatTime(r.preferred_time)}</div>}
            <div className="m">
              {formatPhone(cr.phone)}{r.text_consent ? " · ok to text" : " · no texting"}
              {r.email ? <> · <a href={`mailto:${r.email}`}>{r.email}</a></> : null}
            </div>
          </>
        )}
        {r.notes && <div>Notes: {r.notes}</div>}
        {!contractor && (
          <div className="m">
            {r.terms_accepted_at
              ? `Terms agreed (${r.terms_version}) on ${formatStamp(r.terms_accepted_at)}`
              : "No terms agreement on file (earlier request)"}
          </div>
        )}
      </div>

      <div className="adm-actions three lg">
        <a className="adm-btn primary" href={mapsLink(r)}>Navigate</a>
        {r.phone ? <a className="adm-btn" href={`tel:${r.phone}`}>Call</a> : <span className="adm-btn off" aria-disabled="true">Call</span>}
        {r.phone && r.text_consent ? (
          <a className="adm-btn" href={`sms:${r.phone}`}>Text</a>
        ) : (
          <span className="adm-btn off" aria-disabled="true">Text</span>
        )}
      </div>

      {stageDone(r as never) > 0 && (
        <ol className="adm-progress" aria-label="Job progress">
          {STAGES.map((label, i) => (
            <li key={label} className={i < stageDone(r as never) ? "is-done" : undefined}>
              <span>{i < stageDone(r as never) ? "\u2713" : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      )}

      {r.status === "new" && approve}

      {offer && (
        <>
          <section className="adm-panel line">
            <h2>Deposit</h2>
            <p className="adm-muted" style={{ marginTop: -4 }}>
              {formatDateLabel(offer.date)} at {formatTime(offer.time)}. Not held until the deposit is received. First deposit marked paid wins.
            </p>
            <div className="adm-row2"><span>First hour</span><span>{formatMoney(firstHourCents(r.issue))}</span></div>
            <div className="adm-row2"><span>75% deposit</span><strong>{formatMoney(deposit)}</strong></div>
            <div className="adm-muted">Balance and any extras go on the final invoice.</div>
            <form action={markDepositReceived}>
              <input type="hidden" name="id" value={r.id} />
              <button className="adm-btn primary wide" type="submit">Mark deposit received</button>
            </form>
          </section>
          {r.text_consent && (
            <>
              <a className="adm-btn wide" href={smsLink(cr.phone, offerText(cr, offer, deposit))}>Text client the offer</a>
              <a
                className="adm-btn wide"
                href={smsLink(cr.phone, depositReminderText(cr, `${formatDateLabel(offer.date)} at ${formatTime(offer.time)}`, formatMoney(deposit)))}
              >
                Text a deposit reminder
              </a>
            </>
          )}
          {approve}
        </>
      )}

      {booking && (
        <>
          <section className="adm-panel tint">
            <div className="adm-muted">Booked</div>
            <div className="adm-big">{formatDateLabel(booking.date)} at {formatTime(booking.time)}</div>
            <div>About {booking.hours} {booking.hours === 1 ? "hour" : "hours"} · {fullAddress(r)}</div>
            <div className="adm-muted">
              {contractor ? "No deposit. Invoice after the job." : `Deposit received${r.deposit_paid_at ? ` ${formatStamp(r.deposit_paid_at)}` : ""}.`}
            </div>
          </section>
          <a className="adm-btn outline wide" href={googleCalendarLink({ ...r, notes: r.notes ?? "" }, booking)} target="_blank" rel="noreferrer">
            Add to Google Calendar
          </a>
          {contractor ? null : r.text_consent ? (
            <a className="adm-btn wide" href={smsLink(cr.phone, confirmText(cr, booking))}>Text client the confirmation</a>
          ) : (
            <p className="adm-muted">This client did not opt in to texts. Email or call instead.</p>
          )}
        </>
      )}

      {r.status === "cancelled" && r.cancel_refund && (
        <section className="adm-panel line">
          <h2>{r.refunded_at ? "Deposit refunded" : "Refund due"}</h2>
          <p className="adm-line">
            {r.refunded_at
              ? `Refunded ${formatStamp(r.refunded_at)}.`
              : `Refund the ${formatMoney(deposit)} deposit in QuickBooks, then mark it refunded.`}
          </p>
          {!r.refunded_at && (
            <form action={markRefunded}>
              <input type="hidden" name="id" value={r.id} />
              <button className="adm-btn primary wide" type="submit">Mark refunded</button>
            </form>
          )}
        </section>
      )}

      {!contractor && r.final_paid_at && r.text_consent && GOOGLE_REVIEW_URL && (
        <a className="adm-btn wide" href={smsLink(cr.phone, reviewText(cr, GOOGLE_REVIEW_URL))}>Text a review request</a>
      )}

      <h2 className="adm-sub">Details</h2>
      <div className="adm-details">
        <Drawers r={r} saved={typeof query.saved === "string" ? query.saved : undefined} />
      </div>

      {booking && approve}

      {!contractor && slot && (r.status === "offered" || r.status === "confirmed") && (
        <section className="adm-panel line" id="cancel">
          <h2>Cancel booking</h2>
          <p className="adm-muted">
            {r.status === "offered"
              ? "No deposit received yet, so nothing to refund."
              : refundDue(slot.date, slot.time)
                ? `The visit is ${Math.round(hoursUntil(slot.date, slot.time))} hours away. The deposit is refunded in full.`
                : "The visit is within 24 hours. The deposit is kept, as the policy says."}
          </p>
          <form action={cancelBooking}>
            <input type="hidden" name="id" value={r.id} />
            <button className="adm-btn wide" type="submit">Cancel and email client</button>
          </form>
        </section>
      )}

      {contractor && r.status === "confirmed" && (
        <form action={cancelJob} id="cancel">
          <input type="hidden" name="id" value={r.id} />
          <button className="adm-quiet" type="submit">Cancel this job</button>
        </form>
      )}

      {open && (
        <div className="adm-pinbar">
          {r.status === "new" && <a className="adm-btn primary" href="#approve">Approve</a>}
          {r.status === "offered" && (
            <form action={markDepositReceived}>
              <input type="hidden" name="id" value={r.id} />
              <button className="adm-btn primary" type="submit">Deposit received</button>
            </form>
          )}
          {r.status === "confirmed" && !r.left_at && (
            <form action={stampTime}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="which" value={r.arrived_at ? "left_at" : "arrived_at"} />
              <button className="adm-btn primary" type="submit">{r.arrived_at ? "Left" : "Arrived"}</button>
            </form>
          )}
          {r.status === "confirmed" && r.left_at && <a className="adm-btn primary" href="#money">Invoice</a>}
          {(r.status === "offered" || r.status === "confirmed") && <a className="adm-btn danger" href="#cancel">Cancel</a>}
        </div>
      )}

      {r.status === "new" && <p className="adm-foot">The client gets an email with the day, time and deposit the moment you tap Approve.</p>}
    </>
  );
}
