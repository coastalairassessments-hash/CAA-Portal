import type { CSSProperties } from "react";
import Link from "next/link";
import Logo from "@/app/components/Logo";

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
        <Logo />
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
            Every visit has a one-hour minimum. These are the times we typically recommend to assess
            the whole property, based on its size. We confirm the time for your property when we
            confirm your date, and you may choose to limit it.
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
          <p>
            Every visit includes a minimum of one hour on site at a flat price. Time after that is
            billed by the hour, and you may choose to limit it.
          </p>
          <ul className="price-list">
            <li>
              <h3>Mold and indoor air quality assessment</h3>
              <span className="price">$685</span>
              <div className="detail">
                <p>
                  A noninvasive, science-based inspection to find what is feeding mold, moisture or
                  poor air quality in your home, and why.
                </p>
                <ul>
                  <li>Room-by-room visual inspection of accessible interior areas and exterior interfaces, for visible mold, water damage and construction issues.</li>
                  <li>Instrument readings: temperature, humidity, carbon dioxide, carbon monoxide, formaldehyde, and a particle counter that measures airborne particles room by room.</li>
                  <li>Thermal imaging and moisture mapping to find hidden moisture, thermal bridging and humidity traps.</li>
                  <li>Real-time InstaScope screening where it helps guide the investigation.</li>
                  <li>A written report with photos, your results, a Condition 1, 2 or 3 rating, and recommendations.</li>
                </ul>
                <p>
                  Follows ASTM D7338, with guidance from AIHA, ASHRAE, EPA and IICRC S520. It is
                  limited to accessible areas, and the readings are diagnostic indicators, not
                  medical advice.
                </p>
                <p>Includes the first hour on site. Each additional hour is $195.</p>
              </div>
            </li>
            <li>
              <h3>Post-remediation verification (PRV)</h3>
              <span className="price">$575</span>
              <div className="detail">
                <p>
                  Done after a mold cleanup to evaluate how well it worked in the designated
                  containment areas.
                </p>
                <ul>
                  <li>Visual assessment for any remaining visible fungal growth.</li>
                  <li>Moisture readings of building materials with professional-grade instruments.</li>
                  <li>Verification of cleanliness and the condition of the containment zones.</li>
                  <li>Air and/or surface sampling when it applies, following AIHA and ASTM D7338 protocols.</li>
                  <li>Photos and a detailed report with recommendations based on IICRC S520, AIHA and ASTM guidelines.</li>
                </ul>
                <p>
                  Includes the first hour on site, and most take about an hour. Each additional hour
                  is $195.
                </p>
              </div>
            </li>
            <li>
              <h3>Mold lab sample</h3>
              <span className="price">$85</span>
              <div className="detail">
                <p>
                  A sample of air, a surface, or material, analyzed by an independent accredited lab.
                  We take at least two: one from the affected area and one from an unaffected area to
                  compare against. The lab report is included.
                </p>
                <p>
                  Per sample, when lab testing is part of your assessment. Other kinds of sampling
                  are quoted once we know what you need.
                </p>
              </div>
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
              <summary>Can I limit how long the visit lasts?</summary>
              <p>
                Yes. Every visit is billed for a minimum of one hour, so we are on site for at least
                that long. Larger properties usually take longer to assess fully. If you prefer to
                limit our time on site, that is your decision. The assessment will then cover only
                the areas we can complete in that time, and the findings will reflect only those
                areas. Let us know when you request your date.
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
        <p>
          <Link href="/terms">Mold assessment and sampling terms</Link>
        </p>
      </footer>
    </>
  );
}
