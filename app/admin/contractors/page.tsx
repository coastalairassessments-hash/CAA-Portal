import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { SITE_URL_FALLBACK } from "@/lib/notify";
import { saveContractor, sendLink, setPortalAccess } from "../contractorActions";

export const metadata: Metadata = { title: "Contractors | Coastal Air Assessments", robots: { index: false, follow: false } };

async function Contractors({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const q = await searchParams;
  const site = (process.env.SITE_URL?.trim() || SITE_URL_FALLBACK).replace(/\/+$/, "");
  const supabase = await supabaseForUser();
  const { data, error } = await supabase.from("contractors").select("id, name, email, phone, portal_active").order("name").limit(500);
  return (
    <>
      {error && <p className="adm-err">Contractor login is not set up yet. Run the 0022 SQL in Supabase.</p>}
      {q.error && <p className="adm-err">That did not save. Check the email and try again.</p>}
      {q.saved && <p className="adm-ok">Saved.</p>}
      {q.link && <p className="adm-ok">Sign-in link sent, if the contractor has an email on file.</p>}
      <p className="adm-muted">Contractors sign in at {site}/contractor with an emailed link. Only the emails you add here can sign in.</p>

      <section className="adm-group">
        <h2>Add a contractor</h2>
        <form action={saveContractor} className="adm-field">
          <label htmlFor="nname">Company or name</label>
          <input id="nname" name="name" required maxLength={100} />
          <label htmlFor="nemail">Email</label>
          <input id="nemail" name="email" type="email" required />
          <label htmlFor="nphone">Phone (optional)</label>
          <input id="nphone" name="phone" type="tel" />
          <button className="adm-btn primary wide" type="submit">Add</button>
        </form>
      </section>

      {(data ?? []).map((c) => (
        <details className="adm-group" key={c.id}>
          <summary>{c.name} <span className="v">{c.email ? (c.portal_active ? "Can sign in" : "Access off") : "No email yet"}</span></summary>
          <form action={saveContractor} className="adm-field">
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="name" value={c.name} />
            <label htmlFor={`e-${c.id}`}>Email</label>
            <input id={`e-${c.id}`} name="email" type="email" required defaultValue={c.email ?? ""} />
            <label htmlFor={`p-${c.id}`}>Phone</label>
            <input id={`p-${c.id}`} name="phone" type="tel" defaultValue={c.phone ?? ""} />
            <button className="adm-btn primary wide" type="submit">Save</button>
          </form>
          {c.email && (
            <form action={sendLink}>
              <input type="hidden" name="id" value={c.id} />
              <button className="adm-btn wide" type="submit">Email a sign-in link</button>
            </form>
          )}
          <form action={setPortalAccess}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="on" value={c.portal_active ? "0" : "1"} />
            <button className="adm-quiet" type="submit">{c.portal_active ? "Turn off access" : "Turn access back on"}</button>
          </form>
        </details>
      ))}
    </>
  );
}

export default function ContractorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <div>
          <Link className="adm-link" href="/admin/more">‹ More</Link>
          <h1 className="adm-title">Contractors</h1>
        </div>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Contractors searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
