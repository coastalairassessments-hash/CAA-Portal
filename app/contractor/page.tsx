import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Logo from "@/app/components/Logo";
import { serviceDb } from "@/lib/bookingServer";
import { heldSlots } from "@/lib/availabilityServer";
import { currentContractor } from "@/lib/contractorServer";
import { CONTRACTOR_SERVICES, PRV_HOURS } from "@/lib/contractorAuth";
import { TIMES } from "@/lib/request";
import { formatDateLabel, nextBookableDates, todayInNewYork } from "@/lib/dates";
import { formatTime, issueLabel } from "@/lib/labels";
import { overlaps } from "@/lib/slots";
import { reportState } from "@/lib/report";
import { LICENSE_LINE, PHONE } from "@/lib/business";
import { requestLink, scheduleJob, signOut } from "./actions";

export const metadata: Metadata = {
  title: "Contractor sign-in | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Q = Record<string, string | string[] | undefined>;
const ERRORS: Record<string, string> = {
  taken: "That time was just taken. Pick another.",
  save: "That did not save. Please call or text us.",
  link: "That sign-in link did not work. Ask for a new one below.",
  "1": "Something went wrong. Please try again.",
};

async function Portal({ searchParams }: { searchParams: Promise<Q> }) {
  await connection();
  const q = await searchParams;
  const db = serviceDb();
  const me = db ? await currentContractor(db) : null;
  const err = typeof q.error === "string" ? (ERRORS[q.error] ?? q.error) : null;

  if (!db || !me) {
    return (
      <>
        <h1>Contractor sign-in</h1>
        {q.sent && <p className="bk-lead">If that email is on our contractor list, a sign-in link is on its way. It expires in 15 minutes.</p>}
        {err && <p className="error">{err}</p>}
        <p>Enter your email and we will send you a link. No password.</p>
        <form action={requestLink} className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          <button className="btn" type="submit">Email me a link</button>
        </form>
        <p className="muted">Not set up yet? Call or text <a href="tel:+15614000929">{PHONE}</a> and we will add you.</p>
      </>
    );
  }

  const today = todayInNewYork();
  const held = await heldSlots(today);
  const options: { value: string; label: string }[] = [];
  for (const date of nextBookableDates(new Date(), 40, 1)) {
    for (const time of TIMES) {
      if (held.some((h) => overlaps(h, { date, time, hours: PRV_HOURS }))) continue;
      options.push({ value: `${date}|${time}`, label: `${formatDateLabel(date)} at ${formatTime(time)}` });
    }
  }
  const { data: jobs } = await db
    .from("requests")
    .select("id, status, issue, address, confirmed_date, confirmed_time, final_paid_at, report_path, report_released_at")
    .eq("contractor_id", me.id)
    .order("confirmed_date", { ascending: false })
    .limit(30);

  return (
    <>
      <h1>{me.name}</h1>
      {q.booked && <p className="bk-lead">Booked. We have it on the calendar and will see you there.</p>}
      {err && <p className="error">{err}</p>}

      <section className="bk-prep" id="schedule">
        <h2>Schedule a visit</h2>
        <form action={scheduleJob} className="field">
          <label htmlFor="service">Service</label>
          <select id="service" name="service" defaultValue="prv">
            {CONTRACTOR_SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <label htmlFor="address">Job address</label>
          <input id="address" type="text" name="address" required maxLength={200} placeholder="123 Ocean Blvd, Stuart" autoComplete="street-address" />
          <label htmlFor="slot">Time</label>
          <select id="slot" name="slot" required defaultValue="">
            <option value="" disabled>Pick a time</option>
            {options.slice(0, 80).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label htmlFor="contactName">Who do we meet on site? (optional)</label>
          <input id="contactName" type="text" name="contactName" maxLength={100} />
          <label htmlFor="contactPhone">Their phone (optional)</label>
          <input id="contactPhone" name="contactPhone" type="tel" maxLength={40} />
          <label htmlFor="note">Anything we should know? (optional)</label>
          <textarea id="note" name="note" rows={3} maxLength={500} />
          <button className="btn" type="submit">Book this time</button>
        </form>
        <p className="muted">Monday to Thursday. Booked times are held right away. Changes? Call or text {PHONE}.</p>
      </section>

      <section className="bk-help">
        <h2>Your jobs</h2>
        {(jobs ?? []).length === 0 && <p>No jobs yet.</p>}
        <ul>
          {(jobs ?? []).map((j) => {
            const rs = reportState(j);
            return (
              <li key={j.id}>
                <strong>{j.confirmed_date ? formatDateLabel(j.confirmed_date) : "Date pending"}</strong>
                {j.confirmed_time ? ` at ${formatTime(String(j.confirmed_time).slice(0, 5))}` : ""} · {issueLabel(j.issue)} · {j.address}
                {j.status === "cancelled" ? " (cancelled)" : ""}
                {rs === "ready" && <> · <a href={`/contractor/report/${j.id}`}>Report (PDF)</a></>}
                {rs === "locked" && " · Report ready, unlocks when paid"}
              </li>
            );
          })}
        </ul>
      </section>

      <form action={signOut}><button className="btn btn-quiet" type="submit">Sign out</button></form>
    </>
  );
}

export default function ContractorPage({ searchParams }: { searchParams: Promise<Q> }) {
  return (
    <>
      <header className="wrap site-header"><Logo /></header>
      <main className="wrap">
        <p className="trust-line">{LICENSE_LINE}</p>
        <Suspense fallback={<p>Loading...</p>}>
          <Portal searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
