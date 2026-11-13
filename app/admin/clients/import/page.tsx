import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { importClients } from "../importAction";

export const metadata: Metadata = {
  title: "Import clients | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Q = Record<string, string | string[] | undefined>;
const ERRORS: Record<string, string> = {
  nofile: "Choose a file first.",
  big: "That file is too large. Split it in two and import each part.",
  empty: "No clients found in that file. Make sure it is the CSV export.",
  table: "The client list is not set up yet. Run the 0025 SQL in Supabase first.",
  save: "That did not save. Try again.",
};

async function Body({ searchParams }: { searchParams: Promise<Q> }) {
  await connection();
  const supabase = await supabaseForUser();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");
  const q = await searchParams;
  const { count } = await supabase.from("clients").select("id", { count: "exact", head: true });
  const err = typeof q.error === "string" ? (ERRORS[q.error] ?? "Something went wrong.") : null;
  return (
    <>
      <p className="adm-muted">{count ?? 0} clients in the list now. Importing again is safe: people already here are skipped.</p>
      {typeof q.done === "string" && <p className="adm-ok">Added {q.done} new clients ({String(q.seen ?? "")} in the file).</p>}
      {err && <p className="adm-err" role="alert">{err}</p>}
      <form action={importClients} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        <div className="adm-field">
          <label htmlFor="source">Where is the file from?</label>
          <select id="source" name="source" defaultValue="jobber">
            <option value="jobber">Jobber</option>
            <option value="quickbooks">QuickBooks</option>
          </select>
        </div>
        <div className="adm-field">
          <label htmlFor="file">CSV file</label>
          <input id="file" name="file" type="file" accept=".csv,text/csv" required />
        </div>
        <button className="adm-btn primary wide" type="submit">Import</button>
      </form>
      <Link className="adm-link" href="/admin/clients">Back to Clients</Link>
    </>
  );
}

export default function ImportPage(props: { searchParams: Promise<Q> }) {
  return (
    <main className="adm-wrap">
      <header className="adm-top"><h1 className="adm-title">Import clients</h1></header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Body {...props} />
      </Suspense>
    </main>
  );
}
