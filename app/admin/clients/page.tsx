import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { qbFetch } from "@/lib/qbStore";
import { customerQuery, mapCustomers, telDigits, type Client } from "@/lib/qbCustomers";
import { smsLink } from "@/lib/confirm";

export const metadata: Metadata = {
  title: "Clients | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Results({ searchParams }: Props) {
  await connection();
  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const query = customerQuery(q);

  let clients: Client[] = [];
  let problem = "";
  if (query) {
    try {
      clients = mapCustomers(await qbFetch(`/query?query=${encodeURIComponent(query)}&minorversion=70`));
    } catch (e) {
      problem = e instanceof Error && e.message.includes("not connected")
        ? "QuickBooks is not connected. Connect it on the More screen."
        : "Could not reach QuickBooks. Try again in a moment.";
    }
  }

  return (
    <>
      <form method="get" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <div className="adm-field">
          <label htmlFor="q">Search QuickBooks clients</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Name or company" autoComplete="off" />
        </div>
        <button className="adm-btn primary wide" type="submit">Search</button>
      </form>
      {problem && <p className="adm-err" role="alert">{problem}</p>}
      {!problem && q && !query && <p className="adm-muted">Type at least 2 letters.</p>}
      {!problem && query && clients.length === 0 && <p className="adm-empty">No clients found.</p>}
      {clients.map((c) => {
        const add = `/admin/add?name=${encodeURIComponent(c.name)}${c.address ? `&address=${encodeURIComponent(c.address)}` : ""}`;
        return (
          <article className="adm-card" key={c.id}>
            <h2>{c.name}</h2>
            {c.address && <p className="adm-muted">{c.address}</p>}
            {(c.phone || c.email) && <p className="adm-line">{[c.phone, c.email].filter(Boolean).join(" · ")}</p>}
            <div className="adm-actions three">
              {c.phone ? <a className="adm-btn" href={`tel:${telDigits(c.phone)}`}>Call</a> : <span className="adm-btn off">Call</span>}
              {c.phone ? <a className="adm-btn" href={smsLink(telDigits(c.phone), "")}>Text</a> : <span className="adm-btn off">Text</span>}
              <Link className="adm-btn primary" href={add}>Add job</Link>
            </div>
          </article>
        );
      })}
    </>
  );
}

export default function ClientsPage(props: Props) {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1 className="adm-title">Clients</h1>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Results {...props} />
      </Suspense>
    </main>
  );
}
