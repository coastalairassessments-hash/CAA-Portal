import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { connectionExpired, getConnection } from "@/lib/qbStore";
import { qbHealth } from "@/lib/qbSync";
import { stripeConfigured, stripeHealth } from "@/lib/stripePay";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { money, type DashRow } from "@/lib/dashboard";
import { formatMoney } from "@/lib/pricing";
import { logout } from "../actions";
import PushToggle from "./PushToggle";
import DepositCheck from "./DepositCheck";

export const metadata: Metadata = {
  title: "Office | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

const QB_NOTE: Record<string, string> = {
  connected: "QuickBooks is connected.",
  denied: "QuickBooks was not connected. You can try again.",
  failed: "QuickBooks connection failed. Try again.",
  missing: "QuickBooks keys are missing in Netlify.",
};

async function Payments() {
  await connection();
  const set = stripeConfigured();
  const ok = set ? await stripeHealth() : false;
  return (
    <section className="adm-group">
      <h2>Deposits</h2>
      {ok ? (
        <p className="adm-ok">Working. Clients pay deposits by card on a Stripe page.</p>
      ) : (
        <p className="adm-err">
          {set
            ? "Stripe is not answering, so clients cannot pay deposits. Tap Test deposit payments to see why."
            : "Stripe is not set up yet, so deposits go through QuickBooks."}
        </p>
      )}
      <DepositCheck />
    </section>
  );
}

async function QuickBooks({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const q = await searchParams;
  const why = typeof q.why === "string" ? q.why.slice(0, 160) : "";
  const note = typeof q.qb === "string" ? QB_NOTE[q.qb] + (why ? ` Reason: ${why}` : "") : undefined;
  let linked = false;
  let expired = false;
  let health: Awaited<ReturnType<typeof qbHealth>> | null = null;
  try {
    const conn = await getConnection();
    linked = !!conn;
    expired = !!conn && connectionExpired(conn);
    if (conn && !expired) health = await qbHealth();
  } catch {
    linked = false;
  }
  return (
    <section className="adm-group">
      <h2>QuickBooks</h2>
      <p className="adm-muted">Only used for final invoices. Clients are never held up by it.</p>
      {note && <p className="adm-ok">{note}</p>}
      {health?.ok ? (
        <p className="adm-ok">Working. Linked to {health.company}.</p>
      ) : (
        <>
          <p className="adm-err">
            {expired || linked
              ? "Not connected right now. Reconnect before sending a final invoice."
              : "Not connected yet. Connect before sending a final invoice."}
          </p>
          <a className="adm-btn wide" href="/api/qb/connect">
            {linked ? "Reconnect QuickBooks" : "Connect QuickBooks"}
          </a>
        </>
      )}
    </section>
  );
}

async function Alerts() {
  await connection();
  const key = process.env.VAPID_PUBLIC_KEY?.trim().replace(/^["']+|["']+$/g, "");
  if (!key) return null;
  return <PushToggle publicKey={key} />;
}

const COLUMNS =
  "id, status, issue, size_band, source, booking_mode, left_at, arrived_at, deposit_cents, deposit_paid_at, lab_samples, extras_cents, trip_only, final_paid_at, final_invoice_no, confirmed_date, cancel_refund, refunded_at";

// The numbers a solo owner checks on the road: what is owed, what was paid, how many clients.
async function Hub() {
  await connection();
  const supabase = await supabaseForUser();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  const [jobs, links, clients] = await Promise.all([
    supabase.from("requests").select(COLUMNS).eq("status", "confirmed").order("created_at", { ascending: false }).limit(500),
    supabase.from("payment_links").select("amount_cents, sent_at").is("paid_at", null),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);
  const m = money((jobs.data ?? []) as unknown as DashRow[]);
  const linkRows = links.data ?? [];
  const linksOwed = linkRows.filter((r) => r.sent_at).reduce((n, r) => n + r.amount_cents, 0);
  const saved = linkRows.filter((r) => !r.sent_at).length;
  return (
    <>
      <div className="adm-tiles">
        <Link className="adm-tile hot" href="/admin?tab=owed"><b>{formatMoney(m.owed.total)}</b><span>Owed on jobs</span></Link>
        <Link className="adm-tile" href="/admin/links"><b>{formatMoney(linksOwed)}</b><span>Payment links unpaid{saved > 0 ? ` · ${saved} not sent` : ""}</span></Link>
        <div className="adm-tile"><b>{formatMoney(m.paidThisMonth)}</b><span>Paid this month</span></div>
        <Link className="adm-tile" href="/admin/clients"><b>{clients.count ?? 0}</b><span>Clients</span></Link>
      </div>
    </>
  );
}

export default function MorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1 className="adm-title">Office</h1>
      </header>
      <Suspense fallback={null}>
        <Hub />
      </Suspense>

      <section className="adm-group adm-menu">
        <h2>Money</h2>
        <Link className="adm-btn wide" href="/admin?tab=owed">Who owes me</Link>
        <Link className="adm-btn wide" href="/admin/links">Send a payment link</Link>
        <Link className="adm-btn wide" href="/admin/add">Add a contractor job</Link>
      </section>
      <section className="adm-group adm-menu">
        <h2>People</h2>
        <Link className="adm-btn wide" href="/admin/clients">Find a client</Link>
        <Link className="adm-btn wide" href="/admin/contractors">Contractors and their logins</Link>
        <Link className="adm-btn wide" href="/admin/referrals">Referral partners</Link>
      </section>
      <section className="adm-group adm-menu">
        <h2>On the road</h2>
        <Link className="adm-btn wide" href="/admin/week">This week</Link>
        <Link className="adm-btn wide" href="/admin/texts">Quick texts</Link>
      </section>

      <Suspense fallback={null}>
        <Settings searchParams={searchParams} />
      </Suspense>
      <form action={logout}>
        <button className="adm-btn wide" type="submit">Sign out</button>
      </form>
    </main>
  );
}

async function Settings({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return (
      <details className="adm-group" open={typeof q.qb === "string"}>
        <summary><h2 style={{ display: "inline" }}>Settings and status</h2></summary>
        <Suspense fallback={null}>
          <Alerts />
        </Suspense>
        <Suspense fallback={null}>
          <Payments />
        </Suspense>
        <Suspense fallback={null}>
          <QuickBooks searchParams={searchParams} />
        </Suspense>
        <div className="adm-menu">
          <a className="adm-btn wide" href="/request">Public request page</a>
          <a className="adm-btn wide" href="/terms">Terms clients agree to</a>
          <a className="adm-btn wide" href="/policy">Booking policy</a>
        </div>
      </details>
  );
}
