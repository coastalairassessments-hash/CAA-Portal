import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import { POLICY_INTRO, POLICY_SECTIONS, POLICY_TITLE, POLICY_VERSION } from "@/lib/policy";

export const metadata: Metadata = {
  title: `${POLICY_TITLE} | Coastal Air Assessments`,
  description: "How booking, deposits, payment and cancellation work with Coastal Air Assessments.",
};

export default function PolicyPage() {
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap section terms">
        <h1>{POLICY_TITLE}</h1>
        <p className="muted">Version {POLICY_VERSION}</p>
        <p>{POLICY_INTRO}</p>
        {POLICY_SECTIONS.map((s) => (
          <section key={s.n} aria-labelledby={`p${s.n}`}>
            <h2 id={`p${s.n}`}>
              {s.n}. {s.title}
            </h2>
            <p>{s.text}</p>
          </section>
        ))}
        <p style={{ marginTop: "2rem" }}>
          <Link href="/">Back to home</Link>
        </p>
      </main>
    </>
  );
}
