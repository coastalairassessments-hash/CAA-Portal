import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { formatPhone, formatTime, issueLabel, sizeLabel } from "@/lib/labels";
import { formatDateLabel } from "@/lib/dates";
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
      <p><Link href="/admin">Back to your list</Link></p>
      <h1>{r.name}</h1>
      <p>
        <strong>{r.status}</strong>
        {r.area === "outside" && <span style={{ color: "var(--signal)" }}> · OUTSIDE AREA</span>}
      </p>
      <p>{issueLabel(r.issue)} · {sizeLabel(r.size_band)}</p>
      <p>{r.address}, {r.city} {r.zip}</p>
      <p>
        <a href={`tel:${r.phone}`}>{formatPhone(r.phone)}</a>
        {r.text_consent ? " (ok to text)" : " (no texting)"} ·{" "}
        <a href={`mailto:${r.email}`}>{r.email}</a>
      </p>
      {r.notes && <p>Notes: {r.notes}</p>}
      <p>
        Asked for {formatDateLabel(r.preferred_date)} at {formatTime(r.preferred_time)}
      </p>

      {emailNote === "sent" && <p>Email sent to the client.</p>}
      {emailNote === "failed" && (
        <p className="error">
          The email to the client could not be sent. Use the text button, or contact them yourself.
        </p>
      )}
      {query.error && <p className="error">Something did not save. Try again.</p>}

      {booking && (
        <section>
          <h2>Booked</h2>
          <p>
            {formatDateLabel(booking.date)} at {formatTime(booking.time)} · {booking.hours}{" "}
            {booking.hours === 1 ? "hour" : "hours"}
          </p>
          <p>
            <a className="btn" href={googleCalendarLink(r, booking)} target="_blank" rel="noreferrer">
              Add to Google Calendar
            </a>
          </p>
          {r.text_consent ? (
            <p>
              <a className="btn" href={smsLink(r.phone, confirmText(r, booking))}>
                Text client
              </a>
            </p>
          ) : (
            <p>This client did not opt in to texts. Email or call instead.</p>
          )}
        </section>
      )}

      {r.status !== "declined" && r.status !== "cancelled" && (
        <section>
          <h2>{booking ? "Change the booking" : "Confirm"}</h2>
          <ConfirmForm
            id={r.id}
            defaultDate={booking?.date ?? r.preferred_date}
            defaultTime={booking?.time ?? r.preferred_time}
            label={booking ? "Update and email client" : "Confirm and email client"}
          />
          {!booking && (
            <form action={declineRequest} style={{ marginTop: "1rem" }}>
              <input type="hidden" name="id" value={r.id} />
              <button className="btn btn-quiet" type="submit">Decline and email client</button>
            </form>
          )}
        </section>
      )}
    </>
  );
}

export default function RequestDetailPage(props: Props) {
  return (
    <main className="wrap" style={{ paddingBlock: "2rem" }}>
      <Suspense fallback={<p>Loading...</p>}>
        <Detail {...props} />
      </Suspense>
    </main>
  );
}
