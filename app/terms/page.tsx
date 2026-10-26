import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import {
  TERMS_PREAMBLE,
  TERMS_SECTIONS,
  TERMS_TITLE,
  TERMS_VERSION,
  type Block,
} from "@/lib/terms";

export const metadata: Metadata = {
  title: `${TERMS_TITLE} | Coastal Air Assessments`,
  description: "The terms that apply to mold assessment and sampling services from Coastal Air Assessments.",
};

function BlockView({ b }: { b: Block }) {
  if (b.kind === "ul") {
    return (
      <ul>
        {b.items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    );
  }
  if (b.kind === "caps") {
    return (
      <p>
        <strong>{b.lead}</strong>
        {b.text}
      </p>
    );
  }
  return <p>{b.text}</p>;
}

export default function TermsPage() {
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap section terms">
        <h1>{TERMS_TITLE}</h1>
        <p className="muted">Version {TERMS_VERSION}</p>
        {TERMS_PREAMBLE.map((t) => (
          <p key={t}>{t}</p>
        ))}
        {TERMS_SECTIONS.map((s) => (
          <section key={s.n} aria-labelledby={`t${s.n}`}>
            <h2 id={`t${s.n}`}>
              {s.n}. {s.title}
            </h2>
            {s.blocks.map((b, i) => (
              <BlockView key={i} b={b} />
            ))}
          </section>
        ))}
      </main>
    </>
  );
}
