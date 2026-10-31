import { INSTASCOPE_BODY, INSTASCOPE_PRICE, INSTASCOPE_TITLE } from "@/lib/instascope";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Logo from "@/app/components/Logo";
import { bookingByToken, serviceDb } from "@/lib/bookingServer";
import { SETTLE_COLUMNS, settleDeposit } from "@/lib/settle";
import { CLIENT_STEPS, bookingView } from "@/lib/booking";
import { fullAddress, issueLabel } from "@/lib/labels";
import { depositCents, formatMoney } from "@/lib/pricing";
import { PREP_DO, PREP_DONT, PREP_INTRO } from "@/lib/prep";
import { LIVE_STEPS, liveState } from "@/lib/live";
import { todayInNewYork } from "@/lib/dates";
import { cancelMyBooking } from "../actions";
import LiveRefresh from "./LiveRefresh";

export const metadata: Metadata = {
  title: "Your booking | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Booking({ params, searchParams }: Props) {
  await connection();
  const { token } = await params;
  const q = await searchParams;
  let r = await bookingByToken(token);
  if (!r) notFound();
  // Paid? Book it now, so the client sees the result without waiting for the next check.
  if (r.status === "offered" && r.booking_mode === "instant" && r.qb_deposit_invoice_id) {
    const db = serviceDb();
    const { data: full } = db ? await db.from("requests").select(SETTLE_COLUMNS).eq("id", r.id).maybeSingle() : { data: null };
    if (db && full && (await settleDeposit(db, full as never).catch(() => "waiting")) !== "waiting") {
      r = (await bookingByToken(token)) ?? r;
    }
  }
  const base = bookingView(r as never);
  const live = liveState(r as never, todayInNewYork());
  const v = live ? { ...base, headline: live.headline, detail: live.detail, canCancel: false } : base;
  const first = String(r.name).trim().split(/\s+/)[0];

  return (
    <>
      <h1>{v.headline}</h1>
      <p className="bk-lead">{v.detail}</p>
      {q.error && <p className="error">That did not go through. Please call or text us.</p>}

      {(live || v.paying) && <LiveRefresh every={live ? 30000 : 8000} />}

      {v.paying && (
        <section className="bk-pay">
          {r.pay_url ? (
            <a className="btn" href={r.pay_url}>Pay {formatMoney(r.deposit_cents ?? depositCents(r.issue))} deposit</a>
          ) : (
            <p>We emailed you a secure link to pay the deposit. Open it and your booking confirms automatically.</p>
          )}
          <p className="bk-pay-note">Secure payment by card or bank through QuickBooks. This page updates by itself once you pay.</p>
        </section>
      )}
      {v.expired && (
        <section className="bk-pay">
          <Link className="btn" href="/request">Pick a time again</Link>
        </section>
      )}
      {live && (
        <ol className="bk-steps" aria-label="Visit progress">
          {LIVE_STEPS.map((label, i) => (
            <li key={label} className={i < live.step ? "is-done" : undefined}>
              <span>{i < live.step ? "✓" : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      )}

      {!live && v.step > 0 && (
        <ol className="bk-steps" aria-label="Progress">
          {CLIENT_STEPS.map((label, i) => (
            <li key={label} className={i < v.step ? "is-done" : undefined}>
              <span>{i < v.step ? "✓" : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      )}

      <dl className="bk-facts">
        <div><dt>For</dt><dd>{first}</dd></div>
        <div><dt>Service</dt><dd>{issueLabel(r.issue)}</dd></div>
        <div><dt>When</dt><dd>{v.when}</dd></div>
        <div><dt>Where</dt><dd>{fullAddress(r as never)}</dd></div>
      </dl>

      {v.canCancel && (
        <section className="bk-prep">
          <h2>{INSTASCOPE_TITLE}</h2>
          <p>{INSTASCOPE_BODY} {INSTASCOPE_PRICE}</p>
        </section>
      )}

      {v.canCancel && (
        <section className="bk-prep">
          <h2>Before your visit</h2>
          <p>{PREP_INTRO}</p>
          <ul>{PREP_DO.map((l) => <li key={l}>{l}</li>)}</ul>
          <ul className="no">{PREP_DONT.map((l) => <li key={l}>{l}</li>)}</ul>
        </section>
      )}

      {v.canCancel && (
        <section className="bk-cancel">
          <h2>Need to cancel?</h2>
          <p>{v.cancelNote}</p>
          <form action={cancelMyBooking}>
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="btn btn-quiet">Cancel this booking</button>
          </form>
        </section>
      )}

      <section className="bk-help">
        <h2>Another property?</h2>
        <p><Link href={`/request?again=${token}`}>Book again</Link>. We already have your details, so you only add the address.</p>
      </section>

      <section className="bk-help">
        <h2>Need a different time?</h2>
        <p>Call or text <a href="tel:+15614000929">561-400-0929</a>. Moving a visit more than 24 hours ahead is free.</p>
      </section>

      <p className="bk-foot">
        <Link href="/policy">Booking and payment policy</Link>
      </p>
    </>
  );
}

export default function BookingPage(props: Props) {
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap bk">
        <Suspense fallback={<p className="step-count">Loading...</p>}>
          <Booking {...props} />
        </Suspense>
      </main>
    </>
  );
}
