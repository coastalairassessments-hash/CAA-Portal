import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Logo from "@/app/components/Logo";
import { PLAN_DRAFT, PLAN_PARTS, PLAN_SLUG, PLAN_SUMMARY, PLAN_TITLE } from "@/lib/controlPlan";
import { isAdminUser } from "@/lib/planAccess";

export const metadata: Metadata = PLAN_DRAFT
  ? { title: "Resources | Coastal Air Assessments", robots: { index: false, follow: false } }
  : { title: `${PLAN_TITLE} | Coastal Air Assessments`, description: PLAN_SUMMARY };

async function Index() {
  await connection();
  if (PLAN_DRAFT && !(await isAdminUser())) notFound();
  return (
    <>
      {PLAN_DRAFT && <p className="error">Draft. Only you can see this. It is not public yet.</p>}
      <p><Link href="/resources">‹ Resources</Link></p>
      <div className="plan-hero">
        <p className="plan-kicker">Coastal Air Assessments</p>
        <h1>{PLAN_TITLE}</h1>
        <p>{PLAN_SUMMARY} Each one is a single page. Start at Part 1.</p>
        <Link className="btn plan-gold" href={`/resources/${PLAN_SLUG}/1`}>Start with Part 1</Link>
      </div>
      <ol className="plan-index">
        {PLAN_PARTS.map((x) => (
          <li key={x.n}>
            <Link href={`/resources/${PLAN_SLUG}/${x.n}`}>
              <span className="plan-num">{x.n}</span>
              <span className="plan-idx-text"><small>{x.layer}</small><strong>{x.title}</strong></span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="muted">General household guidance, not medical advice.</p>
    </>
  );
}

export default function PlanIndexPage() {
  return (
    <>
      <header className="wrap site-header"><Logo /></header>
      <main className="wrap terms">
        <Suspense fallback={<p>Loading...</p>}><Index /></Suspense>
      </main>
    </>
  );
}
