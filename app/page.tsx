import type { CSSProperties } from "react";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import { LICENSE_LINE, REPLY_PROMISE } from "@/lib/business";

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
          <h1>It&rsquo;s not about samples. It&rsquo;s about what your building is doing.</h1>
          <p className="lede">
            We look at moisture, airflow and building conditions to find the cause. Samples are one
            tool, used only when they help answer the question.
          </p>
          <p className="lede">
            Licensed Florida mold assessors in Martin, St. Lucie and Palm Beach counties. Pick a
            day in two minutes. Nothing to pay to request.
          </p>
          <div className="actions">
            <Link href="/request" className="btn">
              Request a date
            </Link>
          </div>
          <p className="trust">
            <strong>{LICENSE_LINE}</strong> · {REPLY_PROMISE}
          </p>
        </section>

        <section className="wrap section" aria-labelledby="time-heading">
          <h2 id="time-heading">How long a visit takes</h2>
          <p>
            About an hour for a small home, two to four for a larger one. One hour minimum. You can
            limit our time, and the assessment then covers only what we finish.
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
          <ul className="price-list">
            <li>
              <h3>Consultation</h3>
              <span className="price">$375</span>
              <p className="blurb">
                One hour on site with an expert and instruments. A good start when you are not sure
                what you need. No written report.
              </p>
              <details className="detail">
                <summary>Details</summary>
                <p>
                  A one-hour walkthrough with expert instruments, so we can see the building, take
                  preliminary readings and talk through what the evidence suggests. We then advise
                  on next steps and scope. Time after the first hour is $195 an hour.
                </p>
              </details>
            </li>
            <li>
              <h3>Mold and air quality assessment</h3>
              <span className="price">$685</span>
              <p className="blurb">
                A careful look at what&rsquo;s feeding mold, moisture or poor air. First hour
                included, then $195 an hour.
              </p>
              <details className="detail">
                <summary>Details</summary>
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
              </details>
            </li>
            <li>
              <h3>Post-remediation verification (PRV)</h3>
              <span className="price">$575</span>
              <p className="blurb">
                Confirms a mold cleanup worked. First hour included, then $195 an hour.
              </p>
              <details className="detail">
                <summary>Details</summary>
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
                <p>Most take about an hour.</p>
              </details>
            </li>
            <li>
              <h3>Lab sample</h3>
              <span className="price">$85</span>
              <p className="blurb">
                Each. Used when it helps answer the question. Independent lab, report included.
              </p>
              <details className="detail">
                <summary>Details</summary>
                <p>
                  A sample of air, a surface, or material, analyzed by an independent accredited lab.
                  We take at least two: one from the affected area and one from an unaffected area to
                  compare against.
                </p>
                <p>Other kinds of sampling are quoted once we know what you need.</p>
              </details>
            </li>
          </ul>
          <p>
            Every visit comes with a written report you can share with your insurer or contractor.
          </p>
          <h3 className="typ-head">Typical totals, mold and air quality</h3>
          <ul className="typ">
            <li><span>Small home, about 1 hour</span><strong>$685</strong></li>
            <li><span>About 2 hours</span><strong>$880</strong></li>
            <li><span>About 3 hours</span><strong>$1,075</strong></li>
            <li><span>About 4 hours</span><strong>$1,270</strong></li>
          </ul>
          <p className="fine-print">
            Lab samples are extra, $85 each, only when needed. No surprise fees. We tell you the
            expected time before you pay anything.
          </p>
        </section>

        <section className="wrap section" aria-labelledby="protect-heading">
          <div className="protect">
            <h2 id="protect-heading">Your protection</h2>
            <ul>
              <li>Licensed Florida mold assessor, MRSA2944.</li>
              <li>Cancel more than 24 hours ahead and your deposit is refunded in full.</li>
              <li>Rescheduling is free.</li>
              <li>Payments are processed securely through QuickBooks. We never see your card.</li>
              <li>Samples go to an independent accredited lab.</li>
            </ul>
          </div>
        </section>

        <section className="wrap section" aria-labelledby="how-heading">
          <h2 id="how-heading">How it works</h2>
          <ol className="steps">
            <li>
              <div>
                <h3>Request a day</h3>
                <p>Tell us what you are seeing and where.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>We confirm</h3>
                <p>We reply with the day, time and how long we expect to be there.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>A 75% deposit holds it</h3>
                <p>If two people ask for the same time, the first deposit gets it.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>We visit</h3>
                <p>You pay the balance after, and your report follows within days.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="wrap section faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading">Questions</h2>
          <div style={{ marginTop: "1.25rem" }}>
            <details>
              <summary>Can I limit how long the visit lasts?</summary>
              <p>
                Yes. Every visit is billed for a one-hour minimum. If you would rather limit our
                time, that is your decision. The assessment then covers only the areas we complete,
                and the findings reflect only those areas. Tell us when you request your date.
              </p>
            </details>
            <details>
              <summary>Can I pick my time?</summary>
              <p>
                We schedule Monday through Thursday, starting at 10:00 AM or 12:30 PM. Tell us what
                you prefer and we will confirm what works.
              </p>
            </details>
            <details>
              <summary>What if I need to cancel or reschedule?</summary>
              <p>
                Cancel more than 24 hours before your visit and your deposit is refunded in full.
                You can also reschedule at no charge. Within 24 hours the deposit is not refunded. The details are in our{" "}
                <Link href="/policy">booking policy</Link>.
              </p>
            </details>
            <details>
              <summary>Will you find mold?</summary>
              <p>
                We find out what is going on and why. Sometimes that is mold, sometimes it is
                moisture or airflow that could lead to it. You get a plain written answer either
                way.
              </p>
            </details>
            <details>
              <summary>Do I need lab samples?</summary>
              <p>
                Not always. We use them only when they help answer your question, and we tell you
                before we take any. Each is $85.
              </p>
            </details>
            <details>
              <summary>Is my home unsafe?</summary>
              <p>
                We explain what we see and what, if anything, to do next. Our job is to give you a
                clear answer, not a scare.
              </p>
            </details>
            <details>
              <summary>Where do you work?</summary>
              <p>
                Martin, St. Lucie and Palm Beach counties. Outside that? Send a request anyway and
                we will tell you what is possible.
              </p>
            </details>
          </div>
        </section>

        <section className="wrap">
          <div className="closing">
            <h2>Ready?</h2>
            <p>It takes about two minutes. Nothing to pay until we confirm.</p>
            <Link href="/request" className="btn">
              Request a date
            </Link>
          </div>
        </section>
      </main>

      <footer className="wrap site-footer">
        <p>Coastal Air Assessments. Serving Martin, St. Lucie and Palm Beach counties, Florida.</p>
        <p>{LICENSE_LINE}.</p>
        <p>Questions? Call or text <a href="tel:+15614000929">561-400-0929</a>.</p>
        <p>
          <Link href="/terms">Mold assessment and sampling terms</Link> ·{" "}
          <Link href="/policy">Booking and payment policy</Link> ·{" "}
          <Link href="/privacy">Privacy</Link> ·{" "}
          <Link href="/eula">Terms of use</Link>
        </p>
      </footer>
    </>
  );
}
