import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Logo from "@/app/components/Logo";
import { PLAN_DRAFT, PLAN_PARTS, PLAN_SLUG, PLAN_TITLE, planPart, planSources } from "@/lib/controlPlan";
import { isAdminUser } from "@/lib/planAccess";
import { LICENSE_LINE, PHONE } from "@/lib/business";
import { PlanBlocks } from "../PlanBits";

type Props = { params: Promise<{ part: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part } = await params;
  const x = planPart(Number(part));
  if (PLAN_DRAFT || !x) return { title: "Resources | Coastal Air Assessments", robots: { index: false, follow: false } };
  return { title: `${x.title} | Coastal Air Assessments`, description: x.simple.join(" ") };
}

async function Part({ params }: Props) {
  await connection();
  const { part } = await params;
  const x = planPart(Number(part));
  if (!x) notFound();
  if (PLAN_DRAFT && !(await isAdminUser())) notFound();
  const prev = planPart(x.n - 1);
  const next = planPart(x.n + 1);
  const sources = planSources(x.n);
  const base = `/resources/${PLAN_SLUG}`;
  return (
    <>
      {PLAN_DRAFT && <p className="error">Draft. Only you can see this. It is not public yet.</p>}
      <p><Link href={base}>‹ {PLAN_TITLE}</Link></p>
      <header className="plan-head">
        <p className="plan-kicker">Part {x.n} of {PLAN_PARTS.length} · {x.layer}</p>
        <h1>{x.title}</h1>
        <div className="plan-dots" aria-hidden="true">
          {PLAN_PARTS.map((d) => <span key={d.n} className={d.n === x.n ? "on" : d.n < x.n ? "done" : ""} />)}
        </div>
      </header>
      <section className="plan-simple" aria-label="The simple version">
        <h2>The simple version</h2>
        {x.simple.map((l) => <p key={l}>{l}</p>)}
      </section>
      <PlanBlocks blocks={x.blocks} />
      <section className="plan-next" aria-label="Your next step">
        <h2>Your next step</h2>
        <p>{x.next}</p>
      </section>
      <p>
        <a className="btn btn-quiet" href={`${base}/${x.n}/pdf`}>Full guide with diagrams (PDF)</a>
      </p>
      <nav className="plan-pager" aria-label="Parts">
        {prev ? <Link href={`${base}/${prev.n}`}>‹ Part {prev.n}<small>{prev.title}</small></Link> : <span />}
        {next ? <Link className="plan-pager-next" href={`${base}/${next.n}`}>Part {next.n} ›<small>{next.title}</small></Link> : <Link className="plan-pager-next" href={base}>All parts ›</Link>}
      </nav>
      {sources.length > 0 && (
        <details className="plan-sources">
          <summary>Sources for this part</summary>
          <ol className="guide-refs">
            {sources.map((r) => (
              <li key={r.n} value={r.n}>{r.text} <a href={r.url} rel="noreferrer">{r.url}</a></li>
            ))}
          </ol>
        </details>
      )}
      <p className="muted">
        Coastal Air Assessments · {LICENSE_LINE} · Questions? Call or text <a href="tel:+15614000929">{PHONE}</a>. General household guidance, not medical advice.
      </p>
    </>
  );
}

export default function PlanPartPage(props: Props) {
  return (
    <>
      <header className="wrap site-header"><Logo /></header>
      <main className="wrap terms">
        <Suspense fallback={<p>Loading...</p>}><Part {...props} /></Suspense>
      </main>
    </>
  );
}
