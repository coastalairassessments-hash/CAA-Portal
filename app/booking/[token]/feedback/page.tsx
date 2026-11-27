import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Logo from "@/app/components/Logo";
import { bookingByToken } from "@/lib/bookingServer";
import { GOOGLE_REVIEW_URL } from "@/lib/quicktexts";
import { RATING_LABELS, sendsToGoogle } from "@/lib/feedback";
import { rateVisit, sendFeedbackNote } from "../../actions";

export const metadata: Metadata = {
  title: "How did we do? | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Feedback({ params, searchParams }: Props) {
  await connection();
  const { token } = await params;
  const q = await searchParams;
  const r = await bookingByToken(token);
  if (!r) notFound();
  const first = String(r.name).trim().split(/\s+/)[0];
  const rating = typeof r.feedback_rating === "number" ? r.feedback_rating : null;

  if (!r.left_at) {
    return (
      <>
        <h1>Thank you, {first}</h1>
        <p className="bk-lead">You can tell us how we did once your visit is done.</p>
      </>
    );
  }

  if (rating === null) {
    return (
      <>
        <h1>How did we do, {first}?</h1>
        <p className="bk-lead">One tap. It helps us get better.</p>
        <div className="bk-rate">
          {[1, 2, 3, 4, 5].map((n) => (
            <form key={n} action={rateVisit}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="rating" value={n} />
              <button type="submit" className="btn" aria-label={`${n} of 5, ${RATING_LABELS[n]}`}>
                {n}
                <small>{RATING_LABELS[n]}</small>
              </button>
            </form>
          ))}
        </div>
      </>
    );
  }

  if (sendsToGoogle(rating)) {
    return (
      <>
        <h1>Thank you, {first}</h1>
        <p className="bk-lead">We are glad it went well. If you have a minute, a short Google review helps other homeowners find us.</p>
        <section className="bk-pay">
          <a className="btn" href={GOOGLE_REVIEW_URL}>Leave a Google review</a>
        </section>
      </>
    );
  }

  if (q.thanks || r.feedback_note) {
    return (
      <>
        <h1>Thank you, {first}</h1>
        <p className="bk-lead">We read every note, and we will be in touch.</p>
      </>
    );
  }

  return (
    <>
      <h1>We are sorry, {first}</h1>
      <p className="bk-lead">What could we have done better? Only we see this, and we want to make it right.</p>
      <form action={sendFeedbackNote} className="field">
        <input type="hidden" name="token" value={token} />
        <label htmlFor="note">Your note</label>
        <textarea id="note" name="note" rows={5} maxLength={1000} required />
        <button type="submit" className="btn">Send</button>
      </form>
    </>
  );
}

export default function FeedbackPage(props: Props) {
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap bk">
        <Suspense fallback={<p className="step-count">Loading...</p>}>
          <Feedback {...props} />
        </Suspense>
      </main>
    </>
  );
}
