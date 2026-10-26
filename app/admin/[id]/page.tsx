import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { formatPhone, formatStamp, formatTime, issueLabel, sizeLabel } from "@/lib/labels";
import { formatDateLabel } from "@/lib/dates";
import { mapsLink } from "@/lib/admin";
import { confirmText, smsLink } from "@/lib/confirm";
import { googleCalendarLink } from "@/lib/calendar";
import { declineRequest } from "../actions";
import ConfirmForm from "./ConfirmForm";

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

  const booked = r.status === "confirmed" && r.confirmed_date;
  const booking = booked
    ? { date: r.confirmed_date as string, time: r.confirmed_time as string, hours: r.block_hours as number }
    : null;
  const emailNote = query.email;

  return (
    <>
      <Link className="adm-link" href="/admin">‹ Your day</Link>
      <h1 className="adm-title" style={{ margin: "4px 0 8px" }}>{r.name}</h1>
      <div className="adm-chips" style={{ marginBottom: 14 }}>
        <span className={`adm-chip${r.status === "confirmed" ? " solid" : ""}`}>
          {r.status === "new" ? "New" : r.status === "confirmed" ? "Confirmed" : r.status}
        </span>
        {r.area === "outside" && <span className="adm-chip warn">Outside area</span>}
      </div>

      {emailNote === "sent" && <p className="adm-ok">Email sent to the client.</p>}
      {emailNote === "failed" && (
        <p className="adm-err" style={{ marginBottom: 14 }}>
          The email to the client could not be sent. Use the text button, or contact them yourself.
        </p>
      )}
      {query.error && <p className="adm-err" style={{ marginBottom: 14 }}>Something did not save. Try again.</p>}

      <section className="adm-group">
        <p className="adm-line">{issueLabel(r.issue)} · {sizeLabel(r.size_band)}</p>
        <p className="adm-line">{r.address}, {r.city} {r.zip}</p>
        <p className="adm-muted">
          Asked for {formatDateLabel(r.preferred_date)} at {formatTime(r.preferred_time)}
        </p>
        <p className="adm-muted">
          <a href={`mailto:${r.email}`}>{r.email}</a> · {formatPhone(r.phone)}
          {r.text_consent ? " · ok to text" : " · no texting"}
        </p>
        {r.notes && <p className="adm-line">Notes: {r.notes}</p>}
        <p className="adm-muted">
          {r.terms_accepted_at
            ? `Terms agreed (${r.terms_version}) on ${formatStamp(r.terms_accepted_at)}`
            : "No terms agreement on file (earlier request)"}
        </p>
        <div className="adm-actions three">
          <a className="adm-btn" href={`tel:${r.phone}`}>Call</a>
          {r.text_consent ? (
            <a className="adm-btn" href={`sms:${r.phone}`}>Text</a>
          ) : (
            <span className="adm-btn" aria-disabled="true" style={{ opacity: 0.45 }}>Text</span>
          )}
          <a className="adm-btn" href={mapsLink(r)}>Navigate</a>
        </div>
      </section>

      {booking && (
        <section className="adm-group">
          <h2>Booked</h2>
          <p className="adm-line" style={{ fontSize: 18, fontWeight: 600 }}>
            {formatDateLabel(booking.date)} at {formatTime(booking.time)}
          </p>
          <p className="adm-muted">
            About {booking.hours} {booking.hours === 1 ? "hour" : "hours"} on site
          </p>
          <a className="adm-btn ghost wide" href={googleCalendarLink(r, booking)} target="_blank" rel="noreferrer">
            Add to Google Calendar
          </a>
          {r.text_consent ? (
            <a className="adm-btn wide" href={smsLink(r.phone, confirmText(r, booking))}>
              Text client the confirmation
            </a>
          ) : (
            <p className="adm-muted">This client did not opt in to texts. Email or call instead.</p>
          )}
        </section>
      )}

      {r.status !== "declined" && r.status !== "cancelled" && (
        <section className="adm-group">
          <h2>{booking ? "Change the booking" : "Confirm"}</h2>
          <ConfirmForm
            id={r.id}
            defaultDate={booking?.date ?? r.preferred_date}
            defaultTime={booking?.time ?? r.preferred_time}
            label={booking ? "Update and email client" : "Confirm and email client"}
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
