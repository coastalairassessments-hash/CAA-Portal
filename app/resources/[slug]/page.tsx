import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Logo from "@/app/components/Logo";
import { guideBySlug, type Block } from "@/lib/guides";
import { supabaseForUser } from "@/lib/supabase/server";
import { LICENSE_LINE, PHONE } from "@/lib/business";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = guideBySlug(slug);
  if (!g || g.draft) return { title: "Resources | Coastal Air Assessments", robots: { index: false, follow: false } };
  return { title: `${g.title} | Coastal Air Assessments`, description: g.summary };
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "p") return <p key={i}>{b.text}</p>;
        if (b.kind === "ul") return <ul key={i}>{b.items.map((t) => <li key={t}>{t}</li>)}</ul>;
        return (
          <div className="guide-table" key={i} role="region" tabIndex={0} aria-label="Table">
            <table>
              <thead><tr>{b.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
              <tbody>{b.rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => (ci === 0 ? <th key={ci} scope="row">{c}</th> : <td key={ci}>{c}</td>))}</tr>)}</tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}

async function Guide({ params }: Props) {
  await connection();
  const { slug } = await params;
  const g = guideBySlug(slug);
  if (!g) notFound();
  let isAdmin = false;
  if (g.draft) {
    const supabase = await supabaseForUser();
    const { data: u } = await supabase.auth.getUser();
    if (u.user) isAdmin = !!(await supabase.rpc("is_admin")).data;
    if (!isAdmin) notFound();
  }
  return (
    <>
      {g.draft && <p className="error">Draft. Only you can see this. It is not public yet.</p>}
      <p><Link href="/resources">‹ Resources</Link></p>
      <h1>{g.title}</h1>
      <p className="muted">{g.summary}</p>
      {g.pdf && <p><a className="btn" href={g.pdf} download>Download the PDF</a></p>}
      {g.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          <Blocks blocks={s.blocks} />
        </section>
      ))}
      {g.references && (
        <section>
          <h2>References</h2>
          <ol className="guide-refs">
            {g.references.map((r) => (
              <li key={r.n} value={r.n}>{r.text} <a href={r.url} rel="noreferrer">{r.url}</a></li>
            ))}
          </ol>
        </section>
      )}
      <p className="muted">
        Coastal Air Assessments · {LICENSE_LINE} · Questions? Call or text <a href="tel:+15614000929">{PHONE}</a>. General household guidance, not medical advice.
      </p>
    </>
  );
}

export default function GuidePage(props: Props) {
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap terms">
        <Suspense fallback={<p>Loading...</p>}>
          <Guide {...props} />
        </Suspense>
      </main>
    </>
  );
}
