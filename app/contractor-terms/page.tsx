import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import { CONTRACTOR_TERMS, CONTRACTOR_TERMS_INTRO, CONTRACTOR_TERMS_TITLE, CONTRACTOR_TERMS_VERSION } from "@/lib/contractorTerms";

export const metadata: Metadata = {
  title: `${CONTRACTOR_TERMS_TITLE} | Coastal Air Assessments`,
  description: "How and when contractors are invoiced by Coastal Air Assessments.",
};

export default function ContractorTermsPage() {
  return (
    <>
      <header className="wrap site-header"><Logo /></header>
      <main className="wrap section terms">
        <h1>{CONTRACTOR_TERMS_TITLE}</h1>
        <p className="muted">Version {CONTRACTOR_TERMS_VERSION}</p>
        <p>{CONTRACTOR_TERMS_INTRO}</p>
        {CONTRACTOR_TERMS.map((s) => (
          <section key={s.n} aria-labelledby={`c${s.n}`}>
            <h2 id={`c${s.n}`}>{s.n}. {s.title}</h2>
            <p>{s.text}</p>
          </section>
        ))}
        <p style={{ marginTop: "2rem" }}><Link href="/">Back to home</Link></p>
      </main>
    </>
  );
}
