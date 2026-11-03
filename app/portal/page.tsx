import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import Logo from "@/app/components/Logo";
import { serviceDb } from "@/lib/bookingServer";
import { currentClient } from "@/lib/clientServer";
import { portalRow } from "@/lib/clientPortal";
import { PHONE } from "@/lib/business";
import { requestLink, signOut } from "./actions";

export const metadata: Metadata = { title: "Your portal | Coastal Air Assessments", robots: { index: false, follow: false } };

type Q = Record<string, string | string[] | undefined>;
const ERRORS: Record<string, string> = {
  link: "That sign-in link did not work. Ask for a new one below.",
  "1": "Something went wrong. Please try again.",
};

async function Portal({ searchParams }: { searchParams: Promise<Q> }) {
  await connection();
  const q = await searchParams;
  const db = serviceDb();
  const me = db ? await currentClient(db) : null;
  const err = typeof q.error === "string" ? (ERRORS[q.error] ?? null) : null;

  if (!db || !me) {
    return (
      <>
        <h1>Your portal</h1>
        {q.need === "report" && <p className="bk-lead">Sign in with the email you booked with to open your report.</p>}
        {q.sent && <p className="bk-lead">If that email has a booking with us, a sign-in link is on its way. It expires in 15 minutes.</p>}
        {err && <p className="error">{err}</p>}
        <p>Enter the email you booked with and we will send you a link. No password.</p>
        <form action={requestLink} className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          <button className="btn" type="submit">Email me a link</button>
        </form>
        <p className="muted">Questions? Call or text <a href="tel:+15614000929">{PHONE}</a>.</p>
      </>
    );
  }

  const { data } = await db
    .from("requests")
    .select("id, public_token, status, issue, address, confirmed_date, confirmed_time, preferred_date, left_at, report_path, final_paid_at, report_released_at")
    .eq("client_id", me.id)
    .neq("status", "declined")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []).map((j) => portalRow(j as never));

  return (
    <>
      <h1>{me.name ? `Hi ${me.name.trim().split(/\s+/)[0]}` : "Your portal"}</h1>
      <p className="bk-lead">Your bookings and reports, only visible to you.</p>
      {rows.length === 0 && <p>No bookings yet.</p>}
      {rows.map((r) => (
        <section className="bk-prep" key={r.id}>
          <h2>{r.title}</h2>
          <p>{[r.when, r.address].filter(Boolean).join(" · ")}</p>
          <p><strong>{r.status}</strong></p>
          {r.report === "ready" && <p><a className="btn" href={`/portal/report/${r.id}`}>Open your report (PDF)</a></p>}
          {r.report === "locked" && <p>Your report is ready. It unlocks as soon as your final invoice is paid.</p>}
          {r.bookingPath && <p><Link href={r.bookingPath}>View booking details</Link></p>}
        </section>
      ))}
      <section className="bk-help">
        <p><Link href="/request">Book another visit</Link></p>
        <form action={signOut}><button className="btn btn-quiet" type="submit">Sign out</button></form>
      </section>
    </>
  );
}

export default function PortalPage(props: { searchParams: Promise<Q> }) {
  return (
    <>
      <header className="wrap site-header"><Logo /></header>
      <main className="wrap bk">
        <Suspense fallback={<p className="step-count">Loading...</p>}>
          <Portal {...props} />
        </Suspense>
      </main>
    </>
  );
}
