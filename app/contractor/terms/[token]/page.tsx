import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Logo from "@/app/components/Logo";
import { serviceDb, validToken } from "@/lib/bookingServer";
import { CONTRACTOR_TERMS, CONTRACTOR_TERMS_INTRO, CONTRACTOR_TERMS_TITLE, CONTRACTOR_TERMS_VERSION } from "@/lib/contractorTerms";
import { formatDateLabel } from "@/lib/dates";
import { acceptTerms } from "../actions";

export const metadata: Metadata = { title: `${CONTRACTOR_TERMS_TITLE} | Coastal Air Assessments`, robots: { index: false, follow: false } };

async function Body({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const db = serviceDb();
  const { data: c } = db && validToken(token)
    ? await db.from("contractors").select("name, terms_accepted_at, terms_version").eq("terms_token", token).maybeSingle()
    : { data: null };
  if (!c) return <main className="wrap section terms"><h1>Link not found</h1><p>Call or text us and we will send a new one.</p></main>;
  const accepted = c.terms_version === CONTRACTOR_TERMS_VERSION && c.terms_accepted_at;
  return (
    <main className="wrap section terms">
      <h1>{CONTRACTOR_TERMS_TITLE}</h1>
      <p className="muted">For {c.name} · Version {CONTRACTOR_TERMS_VERSION}</p>
      <p>{CONTRACTOR_TERMS_INTRO}</p>
      {CONTRACTOR_TERMS.map((s) => (
        <section key={s.n}><h2>{s.n}. {s.title}</h2><p>{s.text}</p></section>
      ))}
      {accepted ? (
        <p><strong>Accepted on {formatDateLabel(String(c.terms_accepted_at).slice(0, 10))}. Thank you.</strong></p>
      ) : (
        <form action={acceptTerms} style={{ marginTop: "1.5rem" }}>
          <input type="hidden" name="token" value={token} />
          <button className="btn" type="submit">I agree to these terms</button>
        </form>
      )}
    </main>
  );
}

export default function AcceptPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <>
      <header className="wrap site-header"><Logo /></header>
      <Suspense fallback={<main className="wrap section"><p>Loading...</p></main>}><Body params={params} /></Suspense>
    </>
  );
}
