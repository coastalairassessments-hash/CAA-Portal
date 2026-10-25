import type { CSSProperties } from "react";
import Link from "next/link";

const sizes: { label: string; time: string; h: string; open?: boolean }[] = [
  { label: "Under 2,000 sq ft", time: "About 1 hour", h: "36px" },
  { label: "2,000 to 4,000 sq ft", time: "About 2 to 3 hours", h: "84px" },
  { label: "4,000 to 6,000 sq ft", time: "About 3 to 4 hours", h: "124px" },
  { label: "Over 6,000 sq ft", time: "We confirm with you", h: "160px", open: true },
];

export default function Home() {
  return (
    <>
      <header className="wrap site-header">
        <Link href="/" className="wordmark">
          Coastal Air Assessments
        </Link>
        <Link href="/request" className="btn btn-small">
          Request a date
        </Link>
      </header>

      <main>
        <section className="wrap hero">
          <h1>Mold and air quality assessments, with the price up front.</h1>
          <p className="lede">
            See what a visit costs and how long it takes, then request a date in about two
            minutes. A licensed Florida mold assessor handles every visit.
          </p>
          <div className="actions">
            <Link href="/request" className="btn">
              Request a date
            </Link>
            <span className="fine">No payment to request.</span>
          </div>
        </section>

        <section className="wrap section" aria-labelledby="time-heading">
          <h2 id="time-heading">How long a visit takes</h2>
          <p>
            These are estimates of our time on site, based on the size of the property. We confirm
            the actual time for your property when we confirm your date.
          </p>
          <ol className="ruler" aria-hidden="true">
            {sizes.map((s) => (
              <li key={s.label} className={s.open ? "open" : undefined}>
                <span className="bar" style={{ "--h": s.h } as CSSProperties} />
              </li>
            ))}
          </ol>
          <ul className="ruler-labels">
            {sizes.map((s) => (
              <li key={s.label}>
                <strong>{s.label}</strong>
                <span>{s.time}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="wrap section" aria-labelledby="price-heading">
          <h2 id="price-heading">What it costs</h2>
          <p>Your first hour on site is a flat price. Time after that is billed by the hour.</p>
          <ul className="price-list">
            <li>
              <h3>Mold and indoor air quality assessment</h3>
              <span className="price">$685</span>
              <span className="detail">
                Includes the first hour on site. Each additional hour is $195.
              </span>
            </li>
            <li>
              <h3>Post-remediation verification (PRV)</h3>
              <span className="price">$575</span>
              <span className="detail">
                Confirms a cleanup worked. Includes the first hour on site, and most take about an
                hour. Each additional hour is $195.
              </span>
            </li>
            <li>
              <h3>Mold lab sample</h3>
              <span className="price">$85</span>
              <span className="detail">
                Per sample, when lab testing is part of your assessment. Other kinds of sampling are
                quoted once we know what you need.
              </span>
            </li>
          </ul>
        </section>

        <section className="wrap section" aria-labelledby="how-heading">
          <h2 id="how-heading">How it works</h2>
          <ol className="steps">
            <li>
              <div>
                <h3>Request a date</h3>
                <p>Tell us what you are seeing and where. No payment yet.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>We confirm your date</h3>
                <p>We review your request and confirm the day, time and how long we expect to be on site.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>Lock it in with a deposit</h3>
                <p>You get a payment link for 75% of the service price. Paying it holds your date.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>We inspect</h3>
                <p>We take measurements, collect data and talk through what we find with you.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>Final invoice and report</h3>
                <p>The balance and any extras go on the final invoice. Your written report is issued within a few days of final payment.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="wrap section faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading">Common questions</h2>
          <div style={{ marginTop: "1.25rem" }}>
            <details>
              <summary>Can I choose how long the visit lasts?</summary>
              <p>
                No. We set the time based on the property so the assessment is done properly. The
                size guide above shows what to expect.
              </p>
            </details>
            <details>
              <summary>Can I pick my exact time?</summary>
              <p>
                We schedule Monday through Thursday, with visits starting at 10:00 AM or 12:30 PM.
                Tell us your preferred day and start time and we confirm what works.
              </p>
            </details>
            <details>
              <summary>Where do you work?</summary>
              <p>
                Martin, St. Lucie and Palm Beach counties are our core area. Outside it? Send a
                request anyway and we will let you know what is possible.
              </p>
            </details>
            <details>
              <summary>What if the problem is more complex?</summary>
              <p>
                Some situations start with an initial inspection, where we collect data and talk
                through next steps with you. A follow-up visit happens only if you choose to proceed.
              </p>
            </details>
          </div>
        </section>

        <section className="wrap">
          <div className="closing">
            <h2>Ready to get a date on the calendar?</h2>
            <p>It takes about two minutes, and there is nothing to pay until we confirm.</p>
            <Link href="/request" className="btn">
              Request a date
            </Link>
          </div>
        </section>
      </main>

      <footer className="wrap site-footer">
        <p>Coastal Air Assessments. Serving Martin, St. Lucie and Palm Beach counties, Florida.</p>
      </footer>
    </>
  );
}
