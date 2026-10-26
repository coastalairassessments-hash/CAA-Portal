import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { formatPhone, formatStamp, formatTime, fullAddress, jobLabel, sizeLabel } from "@/lib/labels";
import { formatDateLabel } from "@/lib/dates";
import { mapsLink } from "@/lib/admin";
import { confirmText, offerText, smsLink } from "@/lib/confirm";
import { depositCents, formatMoney } from "@/lib/pricing";
import { googleCalendarLink } from "@/lib/calendar";
import { cancelJob, declineRequest, markDepositReceived } from "../actions";
import ConfirmForm from "./ConfirmForm";
import Drawers from "./Drawers";

export const metadata: Metadata = {
  title: "Request | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function Detail({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  const { data: r } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (!r) notFound();

  const contractor = r.source === "contractor";
  const held = r.status === "confirmed" && r.confirmed_date;
  const offered = r.status === "offered" && r.confirmed_date;
  const slot = r.confirmed_date
    ? { date: r.confirmed_date as string, time: r.confirmed_time as string, hours: r.block_hours as number }
    : null;
  const booking = held ? slot : null;
  const offer = offered ? slot : null;
  const deposit = (r.deposit_cents as number | null) ?? depositCents(r.issue);
  const emailNote = query.email;

  return (
    <>
      <Link className="adm-link" href="/admin">‹ Your day</Link>
      <h1 className="adm-title" style={{ margin: "4px 0 8px" }}>{r.name}</h1>
      <div className="adm-chips" style={{ marginBottom: 14 }}>
        <span className={`adm-chip${r.status === "confirmed" ? " solid" : ""}`}>
          {r.status === "new" ? "New" : r.status === "offered" ? "Deposit waiting" : r.status === "confirmed" ? "Booked" : r.status}
        </span>
        {contractor && <span className="adm-chip">Contractor</span>}
        {r.area === "outside" && <span className="adm-chip warn">Outside area</span>}
      </div>

      {emailNote === "sent" && <p className="adm-ok">Email sent to the client.</p>}
      {emailNote === "failed" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>
          The email to the client could not be sent. Use the text button, or contact them yourself.
        </p>
      )}
      {query.error === "taken" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>
          Another paid job already holds that time, so this deposit could not be booked. Change this client's time below, then mark it again.
        </p>
      )}
      {query.error === "check" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>Check the numbers and dates, then save again.</p>
      )}
      {query.error && query.error !== "taken" && query.error !== "check" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>Something did not save. Try again.</p>
      )}

      <section className="adm-group">
        <p className="adm-line">{jobLabel(r)}{r.size_band ? ` · ${sizeLabel(r.size_band)}` : ""}</p>
        <p className="adm-line">{fullAddress(r)}</p>
        {!contractor && (
          <>
            <p className="adm-muted">
              Asked for {formatDateLabel(r.preferred_date)} at {formatTime(r.preferred_time)}
            </p>
            <p className="adm-muted">
              <a href={`mailto:${r.email}`}>{r.email}</a> · {formatPhone(r.phone)}
              {r.text_consent ? " · ok to text" : " · no texting"}
            </p>
          </>
        )}
        {r.notes && <p className="adm-line">Notes: {r.notes}</p>}
        {!contractor && (
          <p className="adm-muted">
            {r.terms_accepted_at
              ? `Terms agreed (${r.terms_version}) on ${formatStamp(r.terms_accepted_at)}`
              : "No terms agreement on file (earlier request)"}
          </p>
        )}
        <div className="adm-actions three">
          {r.phone ? <a className="adm-btn" href={`tel:${r.phone}`}>Call</a> : <span className="adm-btn" aria-disabled="true" style={{ opacity: 0.45 }}>Call</span>}
          {r.phone && r.text_consent ? (
            <a className="adm-btn" href={`sms:${r.phone}`}>Text</a>
          ) : (
            <span className="adm-btn" aria-disabled="true" style={{ opacity: 0.45 }}>Text</span>
          )}
          <a className="adm-btn" href={mapsLink(r)}>Navigate</a>
        </div>
      </section>

      {offer && (
        <section className="adm-group">
          <h2>Deposit waiting</h2>
          <p className="adm-line" style={{ fontSize: 18, fontWeight: 600 }}>
            {formatDateLabel(offer.date)} at {formatTime(offer.time)}
          </p>
          <p className="adm-muted">
            Not held yet. {formatMoney(deposit)} deposit holds it. First deposit marked paid wins.
          </p>
          <form action={markDepositReceived}>
            <input type="hidden" name="id" value={r.id} />
            <button className="adm-btn primary wide" type="submit">Mark deposit received</button>
          </form>
          {r.text_consent && (
            <a className="adm-btn wide" href={smsLink(r.phone, offerText(r, offer, deposit))}>
              Text client the offer
            </a>
          )}
        </section>
      )}

      {booking && (
        <section className="adm-group">
          <h2>Booked</h2>
          {!contractor && <p className="adm-muted">Deposit received {r.deposit_paid_at ? formatStamp(r.deposit_paid_at) : ""}</p>}
          {contractor && <p className="adm-muted">No deposit. Invoice after the job.</p>}
          <p className="adm-line" style={{ fontSize: 18, fontWeight: 600 }}>
            {formatDateLabel(booking.date)} at {formatTime(booking.time)}
          </p>
          <p className="adm-muted">
            About {booking.hours} {booking.hours === 1 ? "hour" : "hours"} on site
          </p>
          <a className="adm-btn ghost wide" href={googleCalendarLink(r, booking)} target="_blank" rel="noreferrer">
            Add to Google Calendar
          </a>
          {contractor ? null : r.text_consent ? (
            <a className="adm-btn wide" href={smsLink(r.phone, confirmText(r, booking))}>
              Text client the confirmation
            </a>
          ) : (
            <p className="adm-muted">This client did not opt in to texts. Email or call instead.</p>
          )}
        </section>
      )}

      <Drawers r={r} saved={typeof query.saved === "string" ? query.saved : undefined} />

      {contractor && r.status === "confirmed" && (
        <form action={cancelJob}>
          <input type="hidden" name="id" value={r.id} />
          <button className="adm-link" type="submit" style={{ color: "var(--mute)" }}>Cancel this job</button>
        </form>
      )}

      {!contractor && r.status !== "declined" && r.status !== "cancelled" && (
        <section className="adm-group">
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
              <button className="adm-link" type="submit" style={{ color: "var(--mute)" }}>
                Decline and email client
              </button>
            </form>
          )}
        </section>
      )}
    </>
  );
}

export default function RequestDetailPage(props: Props) {
  return (
    <main className="adm-wrap">
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Detail {...props} />
      </Suspense>
    </main>
  );
}
