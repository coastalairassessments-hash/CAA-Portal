import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { balanceCents, type DashRow } from "@/lib/dashboard";
import { formatMoney } from "@/lib/pricing";
import { isStripeId } from "@/lib/stripePay";
import { sendFinalInvoice } from "../actions";

export const metadata: Metadata = {
  title: "Add | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

const COLUMNS =
  "id, status, issue, source, booking_mode, name, address, left_at, arrived_at, deposit_cents, deposit_paid_at, lab_samples, extras_cents, trip_only, final_paid_at, final_invoice_no, confirmed_date, cancel_refund, refunded_at, qb_invoice_id";

type Owed = DashRow & { address: string | null; qb_invoice_id: string | null };

// Visits that are finished but not paid: the ones waiting for an invoice.
async function ReadyToBill() {
  await connection();
  const supabase = await supabaseForUser();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  const { data } = await supabase
    .from("requests")
    .select(COLUMNS)
    .eq("status", "confirmed")
    .not("left_at", "is", null)
    .is("final_paid_at", null)
    .order("left_at", { ascending: false })
    .limit(8);
  const rows = (data ?? []) as unknown as Owed[];
  return (
    <section className="adm-group">
      <h2>Invoice a client</h2>
      {rows.length === 0 && <p className="adm-muted">Nothing is waiting to be billed. Finished visits show here.</p>}
      {rows.map((r) => {
        const sent = isStripeId(r.qb_invoice_id);
        return (
          <article className="adm-card" key={r.id}>
            <h2>{r.name} · {formatMoney(Math.max(balanceCents(r), 0))}</h2>
            {r.address && <p className="adm-muted">{r.address}</p>}
            <p className="adm-line">{sent ? "Card link sent, waiting for payment" : "Not invoiced yet"}</p>
            <div className="adm-actions three">
              <form action={sendFinalInvoice} style={{ display: "contents" }}>
                <input type="hidden" name="id" value={r.id} />
                <button className="adm-btn primary" type="submit">{sent ? "Resend" : "Send invoice"}</button>
              </form>
              <Link className="adm-btn" href={`/admin/${r.id}`}>Open job</Link>
            </div>
          </article>
        );
      })}
      <div className="adm-menu">
        <Link className="adm-btn wide" href="/admin?tab=owed">Everyone who owes me</Link>
        <Link className="adm-btn wide" href="/admin/links">Send a one-off payment link</Link>
      </div>
    </section>
  );
}

export default function AddHub() {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1 className="adm-title">Add</h1>
      </header>

      <form method="get" action="/admin/clients" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <div className="adm-field">
          <label htmlFor="q">Find a client</label>
          <input id="q" name="q" type="search" placeholder="Name, phone, email or address" autoComplete="off" />
        </div>
        <button className="adm-btn wide" type="submit">Search clients</button>
      </form>

      <section className="adm-group adm-menu">
        <h2>Add a job</h2>
        <Link className="adm-btn primary wide" href="/admin/add/job">Schedule a visit (today or later)</Link>
        <Link className="adm-btn wide" href="/admin/add/job?mode=done">Bill a visit that already happened</Link>
        <Link className="adm-btn wide" href="/admin/add/job?mode=trip">Bill a trip fee (not ready or no access)</Link>
      </section>

      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <ReadyToBill />
      </Suspense>

      <section className="adm-group adm-menu">
        <h2>Clients and contractors</h2>
        <Link className="adm-btn wide" href="/admin/clients">Client list, call, text, map</Link>
        <Link className="adm-btn wide" href="/admin/contractors">Add a contractor, send billing terms</Link>
        <Link className="adm-btn wide" href="/admin/payments">Payments received</Link>
      </section>
    </main>
  );
}
